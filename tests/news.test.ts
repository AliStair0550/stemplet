import { test } from "node:test";
import assert from "node:assert/strict";
import { NEWS_COOLDOWN_MS, NEWS_MAX, newsField, nextNewsAllowedAt, parseNews } from "../src/lib/news";

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
