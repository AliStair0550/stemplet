import "server-only";
import http2 from "node:http2";
import { SignJWT, importPKCS8 } from "jose";
import { prisma } from "../prisma";
import { apnsConfig } from "./config";

// Token-baseret APNs (p8-noegle). Push til Wallet er en tom payload {} -
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

function sendOne(
  pushToken: string,
  jwt: string,
  topic: string,
): Promise<void> {
  return new Promise((resolve) => {
    const client = http2.connect("https://api.push.apple.com");
    client.on("error", () => {
      client.close();
      resolve();
    });
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${pushToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": topic,
      "apns-push-type": "background",
      "apns-priority": "5",
      "content-type": "application/json",
    });
    req.setEncoding("utf8");
    req.on("end", () => {
      client.close();
      resolve();
    });
    req.on("error", () => {
      client.close();
      resolve();
    });
    req.write(JSON.stringify({}));
    req.end();
  });
}

/** Sender push til alle registrerede enheder for et kundekort. */
export async function pushWalletUpdate(customerCardId: string): Promise<void> {
  const regs = await prisma.walletRegistration.findMany({
    where: { customerCardId },
  });
  if (regs.length === 0) return;
  const { topic } = apnsConfig();
  const jwt = await providerToken();
  await Promise.all(regs.map((r) => sendOne(r.pushToken, jwt, topic)));
}
