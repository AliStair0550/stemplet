import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { renderPassIcon } from "../src/lib/wallet/icon";

const pixel = async (buf: Buffer, x: number, y: number) => {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};

test("kortets ikon: Apples maal og butikkens farve (ikke Stemplets prik)", async () => {
  const icon = await renderPassIcon({ logoKey: null, loadLogo: async () => null, primaryColor: "#0B2545", textColor: "#FFFFFF", stampIcon: "coffee" });
  for (const [buf, size] of [[icon.x1, 29], [icon.x2, 58], [icon.x3, 87]] as const) {
    const m = await sharp(buf).metadata();
    assert.equal(m.width, size);
    assert.equal(m.height, size);
  }
  assert.deepEqual(await pixel(icon.x3, 1, 1), [0x0b, 0x25, 0x45]);
});

test("kortets ikon: butikkens logo centreret paa dens farve; logoet hentes kun een gang", async () => {
  const logo = await sharp({ create: { width: 200, height: 100, channels: 4, background: "#E7A15B" } }).png().toBuffer();
  let loads = 0;
  const input = { logoKey: "data:test-logo", loadLogo: async () => (loads++, logo), primaryColor: "#FFFFFF", textColor: "#000000", stampIcon: "coffee" };
  const a = await renderPassIcon(input);
  const b = await renderPassIcon(input);
  assert.equal(loads, 1);
  assert.equal(a, b);
  assert.deepEqual(await pixel(a.x3, 43, 43), [0xe7, 0xa1, 0x5b]);
  assert.deepEqual(await pixel(a.x3, 1, 1), [0xff, 0xff, 0xff]);
});

test("kortets ikon: ulaeseligt logo falder tilbage til stempelikonet", async () => {
  const icon = await renderPassIcon({ logoKey: "data:broken", loadLogo: async () => Buffer.from("ikke et billede"), primaryColor: "#123456", textColor: "#FFFFFF", stampIcon: "scissors" });
  assert.equal((await sharp(icon.x2).metadata()).width, 58);
  assert.deepEqual(await pixel(icon.x2, 1, 1), [0x12, 0x34, 0x56]);
});
