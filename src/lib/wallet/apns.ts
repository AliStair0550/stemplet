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
  await pushWalletUpdates([customerCardId]);
}

// Samtidige pushes paa EEN forbindelse. HTTP/2 multiplexer dem, saa en
// udsendelse til mange kort ikke aabner en forbindelse pr. kort (Apple kan
// opfatte mange korte forbindelser som misbrug, og de deler alle samme kort-id).
const STREAMS_PER_CONNECTION = 50;
const TRANSIENT_RETRY_MS = 1000;

/** Sender push til alle registrerede enheder for flere kundekort paa een
 *  forbindelse til Apple. Forbigaaende fejl (429/5xx) proeves een gang til. */
export async function pushWalletUpdates(customerCardIds: string[]): Promise<{ sent: number }> {
  const ids = [...new Set(customerCardIds)];
  if (ids.length === 0) return { sent: 0 };
  const regs = await prisma.walletRegistration.findMany({
    where: { customerCardId: { in: ids } },
    select: { id: true, pushToken: true, customerCardId: true },
  });
  if (regs.length === 0) return { sent: 0 };
  const cardIds = [...new Set(regs.map((r) => r.customerCardId))];
  const ctxCard = cardIds.length === 1 ? cardIds[0] : null;
  // Marker kortene som aendret FOER pushet, saa enheden finder dem, naar den
  // spoerger "hvad er aendret siden sidst" (passesUpdatedSince).
  await prisma.customerCard
    .updateMany({ where: { id: { in: cardIds } }, data: { passUpdatedAt: new Date() } })
    .catch(() => {});
  const { topic } = apnsConfig();

  let jwt: string;
  try {
    jwt = await providerToken();
  } catch (err) {
    // Kritisk: uden provider-token kan INTET pass opdateres. Fejl i signering
    // (fx forkert/udloebet APNS_KEY) skal ses med det samme.
    captureWalletError(err, { operation: "apns:provider-token", customerCardId: ctxCard });
    return { sent: 0 };
  }

  // APNS_ORIGIN kun til integrationstests (en lokal falsk Apple-server).
  const client = http2.connect(process.env.APNS_ORIGIN || "https://api.push.apple.com");
  // Forbindelsesfejl (ECONNRESET, DNS, socket hangup): forbigaaende, og passet
  // selv-healer ved naeste polling. Warn, spam IKKE Sentry. Hver push har sin
  // egen tidsgraense (sendOne), saa intet haenger, selv om forbindelsen doer.
  let connectionError: unknown = null;
  client.on("error", (err) => {
    connectionError = err;
  });

  const dead: string[] = [];
  // Saml udfaldene og rapportér EEN gang pr. udsendelse i stedet for pr.
  // registrering, saa mange enheder ikke giver mange ens events.
  let configCount = 0;
  let configStatus: string | null = null;

  async function sendAll(list: typeof regs): Promise<typeof regs> {
    const transient: typeof regs = [];
    let next = 0;
    async function worker() {
      while (next < list.length) {
        const r = list[next++]!;
        const { status, reason } = await sendOne(client, r.pushToken, jwt, topic);
        switch (classifyApnsStatus(status, reason)) {
          case "dead":
            // Doedt token (afregistreret enhed): forventet, ryd op.
            dead.push(r.id);
            break;
          case "transient":
            transient.push(r);
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
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(STREAMS_PER_CONNECTION, list.length) }, worker),
    );
    return transient;
  }

  let transient: typeof regs = [];
  try {
    transient = await sendAll(regs);
    // Apple overbelastet eller nede et oejeblik: proev de ramte een gang til.
    if (transient.length > 0 && !connectionError) {
      await new Promise((r) => setTimeout(r, TRANSIENT_RETRY_MS));
      transient = await sendAll(transient);
    }
  } finally {
    client.close();
  }

  if (connectionError) {
    const msg =
      connectionError instanceof Error
        ? connectionError.message
        : String(connectionError);
    console.warn(`[apns] forbindelsesfejl (${cardIds.length} kort): ${msg}`);
  }
  if (transient.length > 0) {
    // APNs overbelastet/nede: log lokalt (Vercel-logs) uden at fylde Sentry-kvoten.
    console.warn(
      `[apns] ${transient.length} forbigaaende svar (429/5xx) efter nyt forsoeg (${cardIds.length} kort)`,
    );
  }
  if (configCount > 0) {
    // Konfig-fejl: IKKE forbigaaende. EEN tydelig event pr. udsendelse, og hoejst
    // een pr. interval paa tvaers af udsendelser, saa det egentlige signal ikke
    // drukner i halvtreds ens events.
    const nowMs = Date.now();
    if (nowMs - lastConfigCaptureAt > CONFIG_CAPTURE_INTERVAL_MS) {
      lastConfigCaptureAt = nowMs;
      captureWalletError(
        new Error(
          `APNs-konfiguration er i stykker: ${configCount} enhed(er) afvist med status ${configStatus}`,
        ),
        {
          operation: "apns:config",
          customerCardId: ctxCard,
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
  return { sent: regs.length };
}
