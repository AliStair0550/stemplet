import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { normalizeLogo, LogoError } from "../src/lib/logo";

// Logoet genkodes ved upload: altid PNG, hoejst 1024 px, og et billede med
// absurd mange pixels (lille fil, kaempe hukommelse) afvises.

const dataUri = (buf: Buffer, type: string) => `data:${type};base64,${buf.toString("base64")}`;

test("stort logo skaleres ned til hoejst 1024 px og gemmes som PNG", async () => {
  const jpg = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "#123456" } }).jpeg().toBuffer();
  const out = await normalizeLogo(dataUri(jpg, "image/jpeg"));
  assert.ok(out?.startsWith("data:image/png;base64,"));
  const meta = await sharp(Buffer.from(out!.split(",")[1]!, "base64")).metadata();
  assert.equal(meta.width, 1024);
  assert.equal(meta.height, 512);
});

test("SVG bliver til PNG", async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="red"/></svg>');
  const out = await normalizeLogo(dataUri(svg, "image/svg+xml"));
  assert.ok(out?.startsWith("data:image/png;base64,"));
});

test("billede med for mange pixels afvises", async () => {
  const bomb = await sharp({ create: { width: 8000, height: 8000, channels: 3, background: "#fff" } }).png({ compressionLevel: 9 }).toBuffer();
  await assert.rejects(normalizeLogo(dataUri(bomb, "image/png")), LogoError);
});

test("ulaeseligt logo afvises; adresse og tomt logo er uaendrede", async () => {
  await assert.rejects(normalizeLogo("data:image/png;base64,AAAA"), LogoError);
  assert.equal(await normalizeLogo("https://example.com/logo.png"), "https://example.com/logo.png");
  assert.equal(await normalizeLogo(null), null);
});
