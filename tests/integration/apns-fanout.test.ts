import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import http2 from "node:http2";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";

// Wallet-udsendelse mod en lokal, falsk Apple-server (h2c): alle kort paa EEN
// forbindelse, kun doede tokens slettes, og forbigaaende fejl proeves igen.

import { prisma } from "../../src/lib/prisma";
import { pushWalletUpdates } from "../../src/lib/wallet/apns";

delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
process.env.APNS_KEY = Buffer.from(privateKey.export({ type: "pkcs8", format: "pem" }) as string).toString("base64");
process.env.APNS_KEY_ID = "TESTKEY";
process.env.APPLE_TEAM_ID = "TESTTEAM";
process.env.APPLE_PASS_TYPE_ID = "pass.test";

let sessions = 0;
const hits = new Map<string, number>();
const server = http2.createServer();
server.on("session", () => {
  sessions += 1;
});
server.on("stream", (stream, headers) => {
  const token = String(headers[":path"]).split("/").pop()!;
  const n = (hits.get(token) ?? 0) + 1;
  hits.set(token, n);
  stream.on("data", () => {});
  stream.on("end", () => {
    const reply = (status: number, reason?: string) => {
      stream.respond({ ":status": status, "content-type": "application/json" });
      stream.end(reason ? JSON.stringify({ reason }) : "");
    };
    if (token.startsWith("dead")) reply(410, "Unregistered");
    else if (token.startsWith("bad")) reply(400, "BadDeviceToken");
    else if (token.startsWith("topic")) reply(400, "TopicDisallowed");
    else if (token.startsWith("flaky") && n === 1) reply(503, "ServiceUnavailable");
    else reply(200);
  });
});

before(async () => {
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  process.env.APNS_ORIGIN = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  server.close();
  await prisma.$disconnect();
});

test("mange kort paa een forbindelse; kun doede tokens slettes; 503 proeves igen", async () => {
  const biz = await prisma.business.create({
    data: { name: "IT-apns", slug: `it-apns-${randomUUID()}`, cards: { create: { rewardText: "x" } } },
    include: { cards: true },
  });
  try {
    const kinds = ["ok", "dead", "bad", "topic", "flaky"];
    const ids: string[] = [];
    for (let i = 0; i < 120; i++) {
      const cc = await prisma.customerCard.create({
        data: { cardId: biz.cards[0]!.id, businessId: biz.id, serial: `A${randomUUID().slice(0, 12)}`, authToken: randomUUID() },
      });
      ids.push(cc.id);
      await prisma.walletRegistration.create({
        data: { customerCardId: cc.id, deviceLibraryId: `d${i}`, pushToken: `${kinds[i % kinds.length]}-${i}` },
      });
    }

    const startedAt = new Date();
    const res = await pushWalletUpdates(ids);
    assert.equal(res.sent, 120);
    assert.equal(sessions, 1);

    const left = await prisma.walletRegistration.findMany({
      where: { customerCardId: { in: ids } },
      select: { pushToken: true },
    });
    const kept = new Set(left.map((r) => r.pushToken.split("-")[0]));
    assert.deepEqual([...kept].sort(), ["flaky", "ok", "topic"]);
    assert.equal(left.length, 72);
    for (const [token, n] of hits) {
      assert.equal(n, token.startsWith("flaky") ? 2 : 1, token);
    }
    const touched = await prisma.customerCard.count({ where: { id: { in: ids }, passUpdatedAt: { gte: startedAt } } });
    assert.equal(touched, 120);
  } finally {
    await prisma.business.delete({ where: { id: biz.id } });
  }
});
