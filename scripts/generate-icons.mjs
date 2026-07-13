// Genererer branded PWA-ikoner: dyb-roed cirkel (stempel-farve) paa sand.
import { PNG } from "pngjs";
import { writeFileSync } from "node:fs";

const SAND = [245, 243, 239];
// Dyb roed, som et gammeldags stempel (#8C2C24).
const MOSS = [140, 44, 36];
const PARCHMENT = [250, 248, 244];

function hexPixel(png, x, y, [r, g, b], a = 255) {
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function make(size, { radiusRatio = 0.3, bg = SAND, maskable = false }) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  const r = size * radiusRatio;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // antialiaset kant paa cirklen
      const edge = r - dist;
      if (edge >= 1) {
        hexPixel(png, x, y, MOSS);
      } else if (edge > 0) {
        const t = edge;
        const col = MOSS.map((m, i) => Math.round(m * t + bg[i] * (1 - t)));
        hexPixel(png, x, y, col);
      } else {
        hexPixel(png, x, y, bg);
      }
    }
  }
  return PNG.sync.write(png);
}

const targets = [
  { file: "icon-192.png", size: 192, opts: { radiusRatio: 0.3 } },
  { file: "icon-512.png", size: 512, opts: { radiusRatio: 0.3 } },
  {
    file: "icon-maskable.png",
    size: 512,
    opts: { radiusRatio: 0.24, bg: PARCHMENT, maskable: true },
  },
  { file: "apple-touch-icon.png", size: 180, opts: { radiusRatio: 0.3 } },
];

for (const t of targets) {
  const buf = make(t.size, t.opts);
  writeFileSync(new URL(`../public/${t.file}`, import.meta.url), buf);
  console.log("skrev", t.file);
}
