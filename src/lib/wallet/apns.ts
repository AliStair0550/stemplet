import "server-only";
import http2 from "node:http2";
import { SignJWT, importPKCS8 } from "jose";
import { prisma } from "../prisma";
import { apnsConfig } from "./config";
import { captureWalletError } from "../sentry";
import { classifyApnsStatus } from "./apns-status";

// Token-baseret APNs (p8-nøgle). Push til Wallet er en tom payload {} -
// den beder blot enheden hente det opdaterede pass fra web-servicen.

let cached: { jwt: string; createdAt: number } | null = null;

async function providerToken(): Promise<string> {
  const { key, keyId, teamId } = apnsConfig();
  if (cached && Date.now() - cached.createdAt < 50 * 60 * 1000) {
    return cached.jwt;
  }
  const pk = await importPKCS8(key, "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(pk);
  cached = { jwt, createdAt: Date.now() };
  return jwt;
}

// Sender een push paa en DELT forbindelse og returnerer APNs-status og -aarsag,
// saa doede tokens kan ryddes (410 Unregistered / 400 BadDeviceToken). Svarer
// Apple ikke inden for tidsgraensen, opgiver vi (null), saa en haengende
// forbindelse ikke holder hele udsendelsen fast.
const SEND_TIMEOUT_MS = 10_000;

type ApnsReply = { status: number | null; reason: string | null };

function sendOne(
  client: http2.ClientHttp2Session,
  pushToken: string,
  jwt: string,
  topic: string,
): Promise<ApnsReply> {
  return new Promise((resolve) => {
    let req: http2.ClientHttp2Stream;
    try {
      req = client.request({
        ":method": "POST",
        ":path": `/3/device/${pushToken}`,
        authorization: `bearer ${jwt}`,
        "apns-topic": topic,
        "apns-push-type": "background",
        "apns-priority": "5",
        "content-type": "application/json",
      });
    } catch {
      resolve({ status: null, reason: null });
      return;
    }
    let status: number | null = null;
    let body = "";
    req.on("response", (headers) => {
      const s = headers[":status"];
      status = typeof s === "number" ? s : Number(s) || null;
    });
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      if (body.length < 1000) body += chunk;
    });
    req.on("end", () => resolve({ status, reason: parseReason(body) }));
    req.on("error", () => resolve({ status: null, reason: null }));
    req.setTimeout(SEND_TIMEOUT_MS, () => {
      req.close(http2.constants.NGHTTP2_CANCEL);
      resolve({ status: null, reason: null });
    });
    req.write(JSON.stringify({}));
    req.end();
  });
}

// APNs svarer med {"reason":"BadDeviceToken"} o.l. ved fejl.
function parseReason(body: string): string | null {
  if (!body) return null;
  try {
    const r = (JSON.parse(body) as { reason?: unknown }).reason;
    return typeof r === "string" ? r : null;
  } catch {
    return null;
  }
}

// En konfig-fejl (fx 403 forkert cert/token) rammer ALLE pushes, indtil noeglen
// rettes. For ikke at braende Sentry-kvoten paa dubletter rapporterer vi hoejst
// een gang pr. dette interval (pr. varm lambda), ud over at samle pr. push.
let lastConfigCaptureAt = 0;
const CONFIG_CAPTURE_INTERVAL_MS = 5 * 60 * 1000;

/** Sender push til alle registrerede enheder for et kundekort og rydder doede
 *  push-tokens (afregistrerede/ugyldige enheder). Fejler aldrig hoejlydt. */
export async function pushWalletUpdate(customerCardId: string): Promise<void> {
  const regs = await prisma.walletRegistration.findMany({
    where: { customerCardId },
  });
  if (regs.length === 0) return;
  // Marker kortet som aendret FOER pushet, saa enheden finder det, naar den
  // spoerger "hvad er aendret siden sidst" (passesUpdatedSince).
  await prisma.customerCard
    .update({ where: { id: customerCardId }, data: { passUpdatedAt: new Date() } })
    .catch(() => {});
  const { topic } = apnsConfig();

  let jwt: string;
  try {
    jwt = await providerToken();
  } catch (err) {
    // Kritisk: uden provider-token kan INTET pass opdateres. Fejl i signering
    // (fx forkert/udloebet APNS_KEY) skal ses med det samme.
    captureWalletError(err, { operation: "apns:provider-token", customerCardId });
    return;
  }

  const client = http2.connect("https://api.push.apple.com");
  const dead: string[] = [];
  // Saml udfaldene og rapportér EEN gang pr. push i stedet for pr. registrering,
  // saa et kort med mange enheder ikke giver mange ens events.
  let transientCount = 0;
  let configCount = 0;
  let configStatus: string | null = null;
  let connectionError: unknown = null;

  try {
    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      client.on("error", (err) => {
        // Forbindelsesfejl (ECONNRESET, DNS, socket hangup): forbigaaende, og
        // passet selv-healer ved naeste polling. Warn, spam IKKE Sentry.
        connectionError = err;
        done();
      });
      Promise.all(
        regs.map(async (r) => {
          const { status, reason } = await sendOne(client, r.pushToken, jwt, topic);
          switch (classifyApnsStatus(status, reason)) {
            case "dead":
              // Doedt token (afregistreret enhed): forventet, ryd op.
              dead.push(r.id);
              break;
            case "transient":
              transientCount += 1;
              break;
            case "config":
              configCount += 1;
              if (configStatus === null) {
                configStatus = reason ? `${status} ${reason}` : String(status);
              }
              break;
            case "ok":
              break;
          }
        }),
      ).then(done, done);
    });
  } finally {
    client.close();
  }

  if (connectionError) {
    const msg =
      connectionError instanceof Error
        ? connectionError.message
        : String(connectionError);
    console.warn(`[apns] forbindelsesfejl for kort ${customerCardId}: ${msg}`);
  }
  if (transientCount > 0) {
    // APNs overbelastet/nede: log lokalt (Vercel-logs) uden at fylde Sentry-kvoten.
    console.warn(
      `[apns] ${transientCount} forbigaaende svar (429/5xx) for kort ${customerCardId}`,
    );
  }
  if (configCount > 0) {
    // Konfig-fejl: IKKE forbigaaende. EEN tydelig event pr. push, og hoejst een
    // pr. interval paa tvaers af pushes, saa det egentlige signal ikke drukner i
    // halvtreds ens events.
    const nowMs = Date.now();
    if (nowMs - lastConfigCaptureAt > CONFIG_CAPTURE_INTERVAL_MS) {
      lastConfigCaptureAt = nowMs;
      captureWalletError(
        new Error(
          `APNs-konfiguration er i stykker: ${configCount} enhed(er) afvist med status ${configStatus}`,
        ),
        {
          operation: "apns:config",
          customerCardId,
          extra: { status: configStatus, affected: configCount },
        },
      );
    }
  }

  if (dead.length > 0) {
    await prisma.walletRegistration
      .deleteMany({ where: { id: { in: dead } } })
      .catch(() => {});
  }
}
