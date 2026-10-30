import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { GuideData } from "../src/lib/guide";
import { GuideContent } from "../src/components/guide/GuideContent";
import { formatCooldown } from "../src/lib/utils";

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

test("guiden viser reward og antal stempler fra databasen", () => {
  const html = renderToStaticMarkup(<GuideContent data={sample} />);
  assert.match(html, /8 stempler/); // stampsRequired
  assert.match(html, /10\. kop er gratis/); // rewardText
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

test("guiden viser servicenummeret som et link", () => {
  const html = renderToStaticMarkup(<GuideContent data={sample} />);
  assert.ok(html.includes('href="tel:+4560516538"'));
  assert.ok(html.includes("+45 60 51 65 38"));
});
