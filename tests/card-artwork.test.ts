import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { processArtwork, ArtworkError, ARTWORK_WIDTH, ARTWORK_HEIGHT } from "../src/lib/card-artwork";

test("eget billede: beskaeres til plakatens maal som JPEG", async () => {
  const png = await sharp({ create: { width: 2000, height: 900, channels: 3, background: "#a0705a" } }).png().toBuffer();
  const out = await processArtwork(`data:image/png;base64,${png.toString("base64")}`);
  assert.match(out, /^data:image\/jpeg;base64,/);
  const meta = await sharp(Buffer.from(out.split(",")[1]!, "base64")).metadata();
  assert.equal(meta.width, ARTWORK_WIDTH);
  assert.equal(meta.height, ARTWORK_HEIGHT);
  assert.equal(meta.format, "jpeg");
});

test("eget billede: andet end et billede afvises venligt", async () => {
  await assert.rejects(processArtwork("data:text/plain;base64,aGVq"), ArtworkError);
  await assert.rejects(processArtwork("data:image/png;base64,aGVq"), ArtworkError);
});
