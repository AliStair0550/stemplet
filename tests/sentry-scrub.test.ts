import { test } from "node:test";
import assert from "node:assert/strict";
import type { ErrorEvent } from "@sentry/nextjs";
import { isExternalNoise } from "../src/lib/sentry-scrub";

// Byg et minimalt ErrorEvent med en enkelt exception og de givne frames.
function evt(frames: { filename?: string; in_app?: boolean }[]): ErrorEvent {
  return {
    exception: { values: [{ type: "Error", stacktrace: { frames } }] },
  } as unknown as ErrorEvent;
}

test("in-app-browser-injektion (app:///start) er ekstern stoej", () => {
  // Praecis den fejl fra Sentry: "Can't find variable: SCDynimacBridge" kastet
  // som global code paa app:///start. Sentry markerer frame'en in_app ud fra
  // stien /start, men skemaet app:// afsloerer, at det ikke er vores kode.
  const e = evt([{ filename: "app:///start", in_app: true }]);
  assert.equal(isExternalNoise(e), true);
});

test("andre ikke-http-skemaer (capacitor/file/about) er ekstern stoej", () => {
  for (const fn of ["capacitor://localhost/x", "file:///x.js", "about:blank"]) {
    assert.equal(isExternalNoise(evt([{ filename: fn, in_app: true }])), true, fn);
  }
});

test("blob: fra vores eget origin (worker fra vores bundle) beholdes", () => {
  const e = evt([{ filename: "blob:https://stemplet.alius.dk/uuid", in_app: true }]);
  assert.equal(isExternalNoise(e), false);
});

test("aegte app-fejl (/_next/-chunk) beholdes", () => {
  const e = evt([
    { filename: "https://stemplet.alius.dk/_next/static/chunks/main.js", in_app: true },
  ]);
  assert.equal(isExternalNoise(e), false);
});

test("WebView der omskriver vores egne /_next/-chunks til app:/// beholdes", () => {
  // En rigtig app-fejl maa ikke tabes, blot fordi en WebView har omskrevet
  // origin. /_next/-signalet vinder foer skema-tjekket.
  const e = evt([{ filename: "app:///_next/static/chunks/page.js", in_app: true }]);
  assert.equal(isExternalNoise(e), false);
});

test("blandet stak med mindst een app-frame beholdes", () => {
  const e = evt([
    { filename: "app:///start", in_app: true },
    { filename: "https://stemplet.alius.dk/_next/static/chunks/x.js", in_app: true },
  ]);
  assert.equal(isExternalNoise(e), false);
});

test("event uden exception beholdes (ikke en exception)", () => {
  assert.equal(isExternalNoise({} as ErrorEvent), false);
});

test("exception uden stak beholdes (kan vaere aegte)", () => {
  const e = { exception: { values: [{ type: "Error" }] } } as unknown as ErrorEvent;
  assert.equal(isExternalNoise(e), false);
});
