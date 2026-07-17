import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyApnsStatus } from "../src/lib/wallet/apns-status";

// APNs-svar skal handles forskelligt: doede tokens ryddes, forbigaaende udfald
// (429/5xx) maa ikke braende Sentry-kvoten, og konfig-fejl skal rapporteres.

test("doede tokens (410/400) ryddes op", () => {
  assert.equal(classifyApnsStatus(410), "dead");
  assert.equal(classifyApnsStatus(400), "dead");
});

test("forbigaaende APNs-udfald (429/5xx) er transient (ingen Sentry-spam)", () => {
  assert.equal(classifyApnsStatus(429), "transient");
  assert.equal(classifyApnsStatus(500), "transient");
  assert.equal(classifyApnsStatus(503), "transient");
});

test("konfig-fejl (401/403) rapporteres", () => {
  assert.equal(classifyApnsStatus(401), "config");
  assert.equal(classifyApnsStatus(403), "config");
});

test("200 og ukendt/ingen status goer intet", () => {
  assert.equal(classifyApnsStatus(200), "ok");
  assert.equal(classifyApnsStatus(null), "ok");
});
