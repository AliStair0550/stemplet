import { test } from "node:test";
import assert from "node:assert/strict";
import { NEWS_COOLDOWN_MS, NEWS_MAX, newsField, nextNewsAllowedAt, parseNews, sameAsCurrent } from "../src/lib/news";

// Beskeder fra butikken: tekst paa kortet, notifikation paa laaseskaermen.

test("beskeden trimmes, og tomme eller for lange afvises", () => {
  assert.deepEqual(parseNews("  Nye  åbningstider \n fra mandag "), { ok: true, value: "Nye åbningstider fra mandag" });
  assert.equal(parseNews("   ").ok, false);
  assert.equal(parseNews(null).ok, false);
  assert.equal(parseNews("a".repeat(NEWS_MAX)).ok, true);
  assert.equal(parseNews("a".repeat(NEWS_MAX + 1)).ok, false);
});

test("hoejst een besked i doegnet", () => {
  const now = new Date("2026-11-04T10:00:00Z");
  assert.equal(nextNewsAllowedAt(null, now), null, "aldrig sendt");
  const justNow = new Date(now.getTime() - 60_000);
  assert.equal(nextNewsAllowedAt(justNow, now)?.getTime(), justNow.getTime() + NEWS_COOLDOWN_MS);
  const yesterday = new Date(now.getTime() - NEWS_COOLDOWN_MS - 1);
  assert.equal(nextNewsAllowedAt(yesterday, now), null, "et doegn senere");
});

test("feltet paa kortet giver en notifikation med selve beskeden", () => {
  const f = newsField("Dobbelt stempel i weekenden");
  assert.equal(f.key, "news");
  assert.equal(f.value, "Dobbelt stempel i weekenden");
  assert.equal(f.changeMessage, "%@");
});

test("samme tekst som paa kortene nu giver ingen notifikation og fanges", () => {
  assert.equal(sameAsCurrent("Dobbelt stempel", "dobbelt stempel "), true);
  assert.equal(sameAsCurrent("Dobbelt stempel", "Nye åbningstider"), false);
  assert.equal(sameAsCurrent("Dobbelt stempel", null), false);
});

import { newsBackFields } from "../src/lib/news";

test("kunden kan slaa pushbeskeder fra: intet beskedfelt, men et link til at slaa dem til", () => {
  const url = "https://kort.folka.dk/pushbeskeder/x";
  const on = newsBackFields({ newsText: "Dobbelt stempel", newsOptOut: false, newsOptOutUrl: url });
  assert.deepEqual(on.map((f) => f.key), ["news", "news-settings"]);
  assert.match(on[1].value, /Slå dem fra her/);
  const off = newsBackFields({ newsText: "Dobbelt stempel", newsOptOut: true, newsOptOutUrl: url });
  assert.deepEqual(off.map((f) => f.key), ["news-settings"], "ingen besked = ingen notifikation");
  assert.equal(off[0].changeMessage, undefined, "skiftet giver ingen notifikation");
  assert.match(off[0].value, /Slå dem til igen/);
  // Ingen besked sendt endnu og ikke fravalgt: intet rod paa bagsiden.
  assert.deepEqual(newsBackFields({ newsText: null, newsOptOut: false, newsOptOutUrl: url }), []);
});
