import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { BRANCHER } from "../src/lib/brancher";
import { DANISH_REDIRECTS, DANISH_ROUTES, pathVariants } from "../src/lib/danish-routes";

const APP = join(import.meta.dirname, "..", "src", "app");

function dirs(root: string): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => [join(root, d.name), ...dirs(join(root, d.name))]);
}

const nonAscii = (s: string) => /[^\x00-\x7F]/.test(s);

test("ingen mappe i src/app har æ/ø/å eller andre ikke-ASCII tegn (dev-serveren giver 404)", () => {
  const bad = dirs(APP)
    .map((d) => d.slice(APP.length))
    .filter(nonAscii);
  assert.deepEqual(bad, [], "Omdoeb mappen til ASCII og tilfoej den danske adresse i src/lib/danish-routes.ts");
});

test("hver dansk adresse peger paa en mappe, der findes", () => {
  for (const [pretty, folder] of DANISH_ROUTES) {
    assert.ok(nonAscii(pretty), `${pretty} har ingen danske tegn og behoever ikke en rewrite`);
    assert.ok(existsSync(join(APP, folder, "page.tsx")), `${folder}/page.tsx mangler`);
  }
});

test("alle branchesider med danske tegn er daekket af en rewrite", () => {
  const covered = new Set(DANISH_ROUTES.map(([p]) => p));
  for (const b of BRANCHER) {
    if (!nonAscii(b.slug)) {
      assert.ok(existsSync(join(APP, b.slug, "page.tsx")), `${b.slug}/page.tsx mangler`);
    } else {
      assert.ok(covered.has(b.slug), `${b.slug} mangler i DANISH_ROUTES`);
    }
  }
  for (const [, to] of DANISH_REDIRECTS) assert.ok(!nonAscii(to));
});

test("stien matches baade som den er, procent-kodet og i NFD-form", () => {
  const v = pathVariants("/stempelkort-til-caféer");
  assert.ok(v.includes("/stempelkort-til-caf%C3%A9er"));
  assert.ok(v.includes("/stempelkort-til-cafe%CC%81er"));
  assert.ok(pathVariants("/prøv").includes("/pr%C3%B8v"));
});
