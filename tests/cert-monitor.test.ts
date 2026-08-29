import { test } from "node:test";
import assert from "node:assert/strict";
import { daysUntil, shouldAlert } from "../src/lib/wallet/cert-monitor";

// Wallet-certifikat-overvaagning: dage-til-udloeb og varslings-milepaele.

test("daysUntil regner hele dage til en dato (og negativt efter udloeb)", () => {
  const now = Date.UTC(2026, 0, 1);
  assert.equal(daysUntil(new Date(Date.UTC(2026, 0, 31)), now), 30);
  assert.equal(daysUntil(new Date(Date.UTC(2026, 0, 1)), now), 0);
  assert.equal(daysUntil(new Date(Date.UTC(2025, 11, 25)), now), -7);
});

test("shouldAlert: heads-up ved 30 og 21, dagligt <=14, tavs derimellem", () => {
  assert.equal(shouldAlert(30), true);
  assert.equal(shouldAlert(21), true);
  assert.equal(shouldAlert(28), false);
  assert.equal(shouldAlert(15), false);
  assert.equal(shouldAlert(14), true);
  assert.equal(shouldAlert(7), true);
  assert.equal(shouldAlert(1), true);
  assert.equal(shouldAlert(0), true);
  assert.equal(shouldAlert(-5), true);
});
