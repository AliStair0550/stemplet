import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { GuideData } from "../src/lib/guide";
import { GuideContent } from "../src/components/guide/GuideContent";
import { PIN_MAX_ATTEMPTS, PIN_LOCK_SECONDS } from "../src/lib/system-config";
import { formatCooldown, formatMinutes } from "../src/lib/utils";

const sample: GuideData = {
  businessName: "Test Café",
  slug: "test-cafe",
  stampsRequired: 8,
  rewardText: "10. kop er gratis",
  cooldownMin: 120,
  walletEnabled: false,
  campaigns: [],
};

// ── formatCooldown: konfig-drevet cooldown-tekst ─────────────────────

test("formatCooldown formaterer minutter pænt", () => {
  assert.equal(formatCooldown(120), "2 timer");
  assert.equal(formatCooldown(30), "30 minutter");
  assert.equal(formatCooldown(90), "1 time og 30 minutter");
  assert.equal(formatCooldown(0), "uden ventetid");
});

// ── Guiden renderer med DB- og system-config-vaerdier, ikke hardcodet ─

test("guiden viser butikkens cooldown og reward fra databasen", () => {
  const html = renderToStaticMarkup(<GuideContent data={sample} />);
  assert.match(html, /2 timer/); // cooldownMin=120 formateret
  assert.match(html, /8 stempler/); // stampsRequired
  assert.match(html, /10\. kop er gratis/); // rewardText
});

test("guiden viser PIN-regler fra system-config (ikke hardcodet)", () => {
  const html = renderToStaticMarkup(<GuideContent data={sample} />);
  // Faelder, hvis nogen hardcoder tallene i stedet for at bruge system-config.
  assert.ok(html.includes(`${PIN_MAX_ATTEMPTS} gange`));
  assert.ok(html.includes(formatMinutes(PIN_LOCK_SECONDS)));
});

test("ny cooldown -> ny tekst i guiden (30 min)", () => {
  const html = renderToStaticMarkup(
    <GuideContent data={{ ...sample, cooldownMin: 30 }} />,
  );
  assert.match(html, /30 minutter/);
  assert.equal(/2 timer/.test(html), false);
});

// ── Kampagne-sektion renderes kun naar der er en aktiv kampagne ──────

test("ingen kampagne-sektion uden aktive kampagner", () => {
  const html = renderToStaticMarkup(<GuideContent data={sample} />);
  assert.equal(/Dobbeltstempel kører|Velkomstbonus kører/.test(html), false);
});

test("dobbeltstempel vises naar kampagnen er aktiv", () => {
  const html = renderToStaticMarkup(
    <GuideContent
      data={{
        ...sample,
        campaigns: [{ type: "DOUBLE_STAMP", endsAt: new Date("2026-08-01") }],
      }}
    />,
  );
  assert.match(html, /Dobbeltstempel kører/);
});
