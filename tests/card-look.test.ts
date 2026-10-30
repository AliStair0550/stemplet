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

test("knapper: kun tilgaengelige, ingen dubletter, hoejst to; gamle valg bliver Tilbud og fordele", () => {
  assert.deepEqual(normalizeActions(["fordele", "book"], both), ["fordele", "book"]);
  assert.deepEqual(normalizeActions(["book", "fordele"], stampOnly), ["fordele"]);
  assert.deepEqual(normalizeActions(["book", "fordele"], both), ["fordele", "book"], "fast raekkefoelge");
  assert.deepEqual(normalizeActions(["henvis", "book", "beloenninger"], both), ["fordele", "book"]);
  assert.deepEqual(normalizeActions(["beloenninger", "henvis", "x"], refOnly), ["fordele"]);
  assert.match(actionUnavailableReason("book", refOnly) ?? "", /booking-link/);
});

import { photoPalette } from "../src/lib/brand";

test("eget billede: lyst tema faar lys tekst paa fotoet, moerkt tema er uaendret", () => {
  assert.deepEqual(photoPalette("#EFEBE3", "#1E2633"), { primaryColor: "#1E2633", textColor: "#EFEBE3" });
  assert.deepEqual(photoPalette("#061C3D", "#EAF1FB"), { primaryColor: "#061C3D", textColor: "#EAF1FB" });
});

import { headerShows } from "../src/lib/card-look";

test("oeverst paa kortet: logo, navn eller begge; uden logo altid navnet", () => {
  assert.deepEqual(headerShows("logo", true), { logo: true, name: false });
  assert.deepEqual(headerShows("name", true), { logo: false, name: true });
  assert.deepEqual(headerShows("both", true), { logo: true, name: true });
  assert.deepEqual(headerShows("logo", false), { logo: false, name: true });
  assert.deepEqual(headerShows(undefined, true), { logo: true, name: false });
});
