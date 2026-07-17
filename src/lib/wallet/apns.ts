import "server-only";
import http2 from "node:http2";
import { SignJWT, importPKCS8 } from "jose";
import { prisma } from "../prisma";
import { apnsConfig } from "./config";
import { captureWalletError } from "../sentry";

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

// Sender een push paa en DELT forbindelse og returnerer APNs-statuskoden, saa
// doede tokens kan ryddes (410 Unregistered / 400 BadDeviceToken).
function sendOne(
  client: http2.ClientHttp2Session,
  pushToken: string,
  jwt: string,
  topic: string,
): Promise<number | null> {
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
      resolve(null);
      return;
    }
    let status: number | null = null;
    req.on("response", (headers) => {
      const s = headers[":status"];
      status = typeof s === "number" ? s : Number(s) || null;
    });
    req.setEncoding("utf8");
    req.on("data", () => {});
    req.on("end", () => resolve(status));
    req.on("error", () => resolve(null));
    req.write(JSON.stringify({}));
    req.end();
  });
}

/** Sender push til alle registrerede enheder for et kundekort og rydder doede
 *  push-tokens (afregistrerede/ugyldige enheder). Fejler aldrig hoejlydt. */
export async function pushWalletUpdate(customerCardId: string): Promise<void> {
  const regs = await prisma.walletRegistration.findMany({
    where: { customerCardId },
  });
  if (regs.length === 0) return;
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
        captureWalletError(err, { operation: "apns:connection", customerCardId });
        done();
      });
      Promise.all(
        regs.map(async (r) => {
          const status = await sendOne(client, r.pushToken, jwt, topic);
          // 410/400 = doedt token (afregistreret enhed): forventet, ryd op.
          if (status === 410 || status === 400) dead.push(r.id);
          // Andre ikke-2xx (fx 403 forkert cert/topic, 429, 5xx) er ikke normale
          // og peger paa et konfig-/APNs-problem: rapportér med statuskoden.
          else if (status !== null && status !== 200) {
            captureWalletError(new Error(`APNs svarede ${status}`), {
              operation: "apns:push",
              customerCardId,
              extra: { status },
            });
          }
        }),
      ).then(done, done);
    });
  } finally {
    client.close();
  }

  if (dead.length > 0) {
    await prisma.walletRegistration
      .deleteMany({ where: { id: { in: dead } } })
      .catch(() => {});
  }
}
