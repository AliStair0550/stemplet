import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { inflateRawSync } from "node:zlib";
import { buildPass } from "../src/lib/wallet/pass";

// Hele Wallet-kortet bygges og signeres med et selvsigneret test-certifikat,
// pakkes ud, og pass.json tjekkes: det kunden faktisk ser paa kortet.

before(() => {
  // node-forge (via passkit-generator) har ingen typer i projektet.
  const forge = createRequire(import.meta.url)("node-forge");
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 86_400_000);
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  const attrs = [{ name: "commonName", value: "Folka Kort test" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
  process.env.APPLE_PASS_CERT = Buffer.from(certPem + keyPem).toString("base64");
  process.env.APPLE_WWDR_CERT = Buffer.from(certPem).toString("base64");
  process.env.APPLE_PASS_TYPE_ID = "pass.dk.folka.test";
  process.env.APPLE_TEAM_ID = "TESTTEAM01";
  process.env.AUTH_SECRET = "test-secret-wallet";
  delete process.env.WALLET_POSTER;
});

/** Pakker en zip ud (stored eller deflate) via central directory. */
function unzip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(eocd >= 0, "gyldig zip");
  let p = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(dataStart, dataStart + size);
    files.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

type Field = { key: string; label?: string; value: unknown; changeMessage?: string };
type PassJson = {
  serialNumber: string;
  passTypeIdentifier: string;
  teamIdentifier: string;
  authenticationToken: string;
  backgroundColor: string;
  foregroundColor: string;
  sharingProhibited: boolean;
  logoText?: string;
  barcodes: { format: string; message: string; altText: string }[];
  locations?: { latitude: number; longitude: number; relevantText: string }[];
  storeCard: { headerFields: Field[]; secondaryFields: Field[]; backFields: Field[] };
};

const base = {
  serial: "FK-TEST-0001",
  authToken: "auth-token-til-test-0001",
  businessName: "Café Test",
  primaryColor: "#123B47",
  textColor: "#FFFFFF",
  logoUrl: null,
  stampIcon: "coffee",
  rewardText: "Gratis kaffe",
  terms: null,
  stamps: 3,
  required: 10,
  lifetimeStamps: 13,
  completedCount: 1,
  latitude: null,
  longitude: null,
};

async function build(overrides: Partial<Parameters<typeof buildPass>[0]> = {}) {
  const files = unzip(await buildPass({ ...base, ...overrides }));
  const pass = JSON.parse(files.get("pass.json")!.toString("utf8")) as PassJson;
  return { files, pass };
}

const field = (fields: Field[], key: string) => fields.find((f) => f.key === key);

test("kortet er signeret og har manifest, ikon og stempelgitter", async () => {
  const { files } = await build();
  for (const name of ["pass.json", "manifest.json", "signature", "icon.png", "icon@2x.png", "strip.png", "strip@2x.png"]) {
    assert.ok(files.has(name), `${name} mangler`);
  }
  const manifest = JSON.parse(files.get("manifest.json")!.toString("utf8")) as Record<string, string>;
  assert.ok(manifest["pass.json"], "pass.json er i manifestet");
  assert.ok(files.get("signature")!.length > 100, "signaturen er ikke tom");
});

test("pass.json: id'er, serienummer, QR og butikkens farve", async () => {
  const { pass } = await build();
  assert.equal(pass.serialNumber, "FK-TEST-0001");
  assert.equal(pass.passTypeIdentifier, "pass.dk.folka.test");
  assert.equal(pass.teamIdentifier, "TESTTEAM01");
  assert.equal(pass.authenticationToken, "auth-token-til-test-0001");
  assert.equal(pass.sharingProhibited, true);
  assert.equal(pass.backgroundColor, "rgb(18, 59, 71)");
  assert.equal(pass.foregroundColor, "rgb(255, 255, 255)");
  assert.equal(pass.logoText, "Café Test", "uden logo staar navnet i toppen");
  assert.deepEqual(
    { format: pass.barcodes[0]!.format, message: pass.barcodes[0]!.message, altText: pass.barcodes[0]!.altText },
    { format: "PKBarcodeFormatQR", message: "FK-TEST-0001", altText: "FK-TEST-0001" },
  );
});

test("forsiden: STEMPLER x/y, beloenning, navn og samlet i alt", async () => {
  const { pass } = await build({ holderName: "Mette" });
  const card = pass.storeCard;
  assert.equal(field(card.headerFields, "stamps")?.label, "STEMPLER");
  assert.equal(field(card.headerFields, "stamps")?.value, "3/10");
  assert.equal(field(card.secondaryFields, "reward")?.value, "Gratis kaffe");
  assert.deepEqual(
    { label: field(card.secondaryFields, "holder")?.label, value: field(card.secondaryFields, "holder")?.value },
    { label: "NAVN", value: "Mette" },
  );
  assert.equal(field(card.secondaryFields, "lifetime")?.value, "13");
});

test("forsiden: fuldt kort viser aldrig mere end y/y", async () => {
  const { pass } = await build({ stamps: 11 });
  assert.equal(field(pass.storeCard.headerFields, "stamps")?.value, "10/10");
  assert.match(String(field(pass.storeCard.backFields, "progress")?.value), /Kortet er fuldt/);
});

test("bagsiden: link til tilbud og henvis en ven, betingelser og historik", async () => {
  const { pass } = await build({ terms: "Kan ikke kombineres." });
  const back = pass.storeCard.backFields;
  const benefits = field(back, "benefits");
  assert.equal(benefits?.label, "Tilbud og henvis en ven");
  assert.match(String(benefits?.value), /\/fordele\/FK-TEST-0001\.[\w-]+$/);
  assert.equal(field(back, "terms")?.value, "Kan ikke kombineres.");
  assert.match(String(field(back, "loyalty")?.value), /13 stempler hos Café Test og fyldt 1 kort/);
});

test("besked fra butikken giver en notifikation, men ikke naar kunden har slaaet den fra", async () => {
  const on = await build({ newsText: "Ny kage i dag" });
  const news = field(on.pass.storeCard.backFields, "news");
  assert.equal(news?.value, "Ny kage i dag");
  assert.equal(news?.changeMessage, "%@");

  const off = await build({ newsText: "Ny kage i dag", newsOptOut: true });
  assert.equal(field(off.pass.storeCard.backFields, "news"), undefined);
});

test("henvisninger: NAVN indtil der er noget til gode, saa TIL GODE med besked", async () => {
  const referral = {
    code: "METTE-K7",
    shareUrl: "https://kort.folka.dk/h/METTE-K7",
    pageUrl: "https://kort.folka.dk/k/cafe-test",
    termsLine: null,
    newCustomerReward: "100 kr.",
    referrerReward: "100 kr.",
    referralsDone: 0,
    rewards: [] as { type: "AMOUNT"; value: string }[],
    announce: false,
    holderName: "Mette",
  };
  const none = await build({ referral });
  assert.deepEqual(
    { label: field(none.pass.storeCard.secondaryFields, "ref-owed")?.label, value: field(none.pass.storeCard.secondaryFields, "ref-owed")?.value },
    { label: "NAVN", value: "Mette" },
  );
  assert.equal(field(none.pass.storeCard.secondaryFields, "holder"), undefined, "navnet staar kun een gang");

  const owed = await build({
    referral: { ...referral, referralsDone: 1, rewards: [{ type: "AMOUNT", value: "100" }], announce: true },
  });
  const f = field(owed.pass.storeCard.secondaryFields, "ref-owed");
  assert.equal(f?.label, "TIL GODE");
  assert.match(String(f?.value), /100/);
  assert.match(String(f?.changeMessage), /Din ven har været her/);
});

test("butikkens placering giver en laaseskaerm-tekst", async () => {
  const { pass } = await build({ latitude: 55.6761, longitude: 12.5683 });
  assert.equal(pass.locations?.[0]?.latitude, 55.6761);
  assert.equal(pass.locations?.[0]?.relevantText, "Velkommen tilbage hos Café Test");
});
