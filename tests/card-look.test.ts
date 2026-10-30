import { test } from "node:test";
import assert from "node:assert/strict";
import { effectiveStyle, normalizeActions, actionUnavailableReason } from "../src/lib/card-look";

const both = { stampsEnabled: true, referralsEnabled: true, bookingUrl: "https://planway.com/salon" };
const stampOnly = { stampsEnabled: true, referralsEnabled: false, bookingUrl: null };
const refOnly = { stampsEnabled: false, referralsEnabled: true, bookingUrl: null };

test("stil: Stempler kraever Stemplet, billede kraever et billede", () => {
  assert.equal(effectiveStyle("stamps", both, false), "stamps");
  assert.equal(effectiveStyle("stamps", refOnly, false), "color");
  assert.equal(effectiveStyle("photo", both, false), "color");
  assert.equal(effectiveStyle("photo", both, true), "photo");
  assert.equal(effectiveStyle("ukendt", both, true), "color");
});

test("knapper: kun tilgaengelige, ingen dubletter, hoejst to", () => {
  assert.deepEqual(normalizeActions(["henvis", "book", "beloenninger"], both), ["henvis", "book"]);
  assert.deepEqual(normalizeActions(["book", "henvis", "beloenninger"], stampOnly), ["beloenninger"]);
  assert.deepEqual(normalizeActions(["beloenninger", "beloenninger", "x"], both), ["beloenninger"]);
  assert.match(actionUnavailableReason("book", refOnly) ?? "", /booking-link/);
});

import { photoPalette } from "../src/lib/brand";

test("eget billede: lyst tema faar lys tekst paa fotoet, moerkt tema er uaendret", () => {
  assert.deepEqual(photoPalette("#EFEBE3", "#1E2633"), { primaryColor: "#1E2633", textColor: "#EFEBE3" });
  assert.deepEqual(photoPalette("#061C3D", "#EAF1FB"), { primaryColor: "#061C3D", textColor: "#EAF1FB" });
});
