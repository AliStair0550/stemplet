import { test } from "node:test";
import assert from "node:assert/strict";
import { focusFromParam, posterRewardLine } from "../src/lib/materials";

const both = { stampsEnabled: true, referralsEnabled: true };
const refOnly = { stampsEnabled: false, referralsEnabled: true };
const stampOnly = { stampsEnabled: true, referralsEnabled: false };

test("plakat: kundekortet kan altid vaelges; henvis kraever Henvisninger", () => {
  assert.equal(focusFromParam(null, refOnly), "kort");
  assert.equal(focusFromParam("henvis", refOnly), "henvis");
  assert.equal(focusFromParam("henvis", stampOnly), "kort");
  assert.equal(focusFromParam("henvis", both), "henvis");
});

test("plakat: kundekortet naevner alt paa kortet", () => {
  const r = { friendReward: "100 kr.", referrerReward: "gratis klip" };
  assert.equal(posterRewardLine("kort", { stampReward: "Gratis kaffe", ...r }), "Gratis kaffe. Henvis en ven, og få gratis klip.");
  assert.equal(posterRewardLine("kort", { stampReward: "Gratis kaffe", friendReward: null, referrerReward: null }), "Gratis kaffe");
  assert.equal(posterRewardLine("kort", { stampReward: null, ...r }), "Din ven får 100 kr. Du får gratis klip.");
  assert.equal(posterRewardLine("henvis", { stampReward: "Gratis kaffe", ...r }), "Din ven får 100 kr. Du får gratis klip.");
});

test("plakatens gemte valg: gyldige vaerdier beholdes, alt andet renses", async () => {
  const { parsePosterSettings, DEFAULT_POSTER_SETTINGS } = await import("../src/lib/materials");
  assert.deepEqual(parsePosterSettings(null), DEFAULT_POSTER_SETTINGS);
  assert.deepEqual(parsePosterSettings({ focus: "henvis", size: "skilt", bg: "billede", brand: false, grid: false, headline: "  Hent   dit kort  " }), {
    focus: "henvis",
    size: "skilt",
    bg: "billede",
    brand: false,
    grid: false,
    headline: "Hent dit kort",
  });
  const bad = parsePosterSettings({ focus: "x", size: 3, bg: "neon", brand: "ja", headline: "a".repeat(200) });
  assert.equal(bad.focus, "kort");
  assert.equal(bad.size, "plakat");
  assert.equal(bad.bg, "farve");
  assert.equal(bad.brand, true);
  assert.equal(bad.headline.length, 40);
});
