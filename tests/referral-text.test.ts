import { test } from "node:test";
import assert from "node:assert/strict";

import {
  rewardPhrase,
  firstName,
  referralShareUrl,
  referralShareText,
} from "../src/lib/referral-text";

const NBSP = " ";

test("beloenning: beloeb og stempler med haardt mellemrum", () => {
  assert.equal(rewardPhrase("AMOUNT", "100"), `100${NBSP}kr.`);
  assert.equal(rewardPhrase("STAMPS", "3"), `3${NBSP}stempler`);
  assert.equal(rewardPhrase("STAMPS", "1"), `1${NBSP}stempel`);
});

test("beloenning: service faar lille forbogstav midt i saetningen", () => {
  assert.equal(rewardPhrase("SERVICE", "Gratis klip"), "gratis klip");
  assert.equal(rewardPhrase("SERVICE", "SPA-behandling"), "SPA-behandling");
  assert.equal(rewardPhrase("SERVICE", "Øjenbrynsfarvning"), "øjenbrynsfarvning");
});

test("fornavn til overskriften", () => {
  assert.equal(firstName("sara jensen"), "Sara");
  assert.equal(firstName("  Mikkel "), "Mikkel");
  assert.equal(firstName(""), null);
  assert.equal(firstName(null), null);
});

test("delelink og -besked", () => {
  assert.equal(
    referralShareUrl("https://stemplet.alius.dk", "sara-salon", "SARA-K8"),
    "https://stemplet.alius.dk/henvisninger/sara-salon?k=SARA-K8",
  );
  assert.equal(
    referralShareText("Sara Salon", `100${NBSP}kr.`),
    `Jeg har en rabat til dig hos Sara Salon: 100${NBSP}kr. ved dit første besøg.`,
  );
});

// ── Kassens soegefelt ────────────────────────────────────────────────

import { classifyDeskQuery } from "../src/lib/referral-query";

test("kassesoegning: kode, mobil eller navn", () => {
  assert.deepEqual(classifyDeskQuery(" sara-k8 "), { kind: "code", value: "SARA-K8" });
  assert.deepEqual(classifyDeskQuery("VEN-AB3"), { kind: "code", value: "VEN-AB3" });
  assert.deepEqual(classifyDeskQuery("12 34 56 78"), { kind: "phone", value: "12345678" });
  assert.deepEqual(classifyDeskQuery("+45 1234"), { kind: "phone", value: "451234" });
  assert.deepEqual(classifyDeskQuery("5678"), { kind: "phone", value: "5678" });
  assert.deepEqual(classifyDeskQuery("  Sara   Jensen "), { kind: "name", value: "Sara Jensen" });
  assert.deepEqual(classifyDeskQuery("Mette-Marie"), { kind: "name", value: "Mette-Marie" });
});

test("kassesoegning: for kort eller tomt giver ingen soegning", () => {
  assert.equal(classifyDeskQuery(""), null);
  assert.equal(classifyDeskQuery("a"), null);
  assert.equal(classifyDeskQuery("123"), null);
});

test("kassesoegning: navn med bindestreg forveksles ikke med en kode", () => {
  assert.deepEqual(classifyDeskQuery("Anne-Bo"), { kind: "name", value: "Anne-Bo" });
  assert.deepEqual(classifyDeskQuery("Ida-Lis"), { kind: "name", value: "Ida-Lis" });
});

// ── Wallet-felter (fase 4) ───────────────────────────────────────────

import {
  owedLabel,
  referralFrontFields,
  referralBackFields,
  type ReferralPassInfo,
} from "../src/lib/wallet/referral-fields";

const info = (over: Partial<ReferralPassInfo> = {}): ReferralPassInfo => ({
  code: "SARA-K8",
  shareUrl: "https://stemplet.alius.dk/henvisninger/sara-salon?k=SARA-K8",
  pageUrl: "https://stemplet.alius.dk/henvisninger/sara-salon",
  termsLine: "Gælder ved første besøg over 300 kr.",
  referralsDone: 0,
  rewards: [],
  announce: false,
  ...over,
});

test("wallet: til gode lægger beløb sammen, ellers behandling eller antal", () => {
  assert.equal(owedLabel([]), "Intet endnu");
  assert.equal(
    owedLabel([{ type: "AMOUNT", value: "100" }, { type: "AMOUNT", value: "50" }]),
    `150${NBSP}kr.`,
  );
  assert.equal(owedLabel([{ type: "SERVICE", value: "Gratis klip" }]), "Gratis klip");
  assert.equal(
    owedLabel([{ type: "SERVICE", value: "Gratis klip" }, { type: "AMOUNT", value: "100" }]),
    "2 belønninger",
  );
});

test("wallet: forsiden viser kode og til gode, altid begge felter", () => {
  const f = referralFrontFields(info());
  assert.deepEqual(f.map((x) => x.key), ["ref-code", "ref-owed"]);
  assert.equal(f[0]!.value, "SARA-K8");
  assert.equal(f[1]!.value, "Intet endnu");
  assert.equal(f[1]!.changeMessage, undefined);
});

test("wallet: besked kun ved en ny belønning, og ambassadøren får 'din ven'-beskeden", () => {
  const rewards = [{ type: "AMOUNT" as const, value: "100" }];
  const amb = referralFrontFields(info({ rewards, announce: true, referralsDone: 1 }))[1]!;
  assert.equal(amb.changeMessage, "Din ven har været her. Du har nu %@ til gode.");
  const ny = referralFrontFields(info({ rewards, announce: true }))[1]!;
  assert.equal(ny.changeMessage, "Du har nu %@ til gode.");
  // Efter en indløsning: ingen besked.
  assert.equal(referralFrontFields(info({ rewards, announce: false }))[1]!.changeMessage, undefined);
});

test("wallet: bagsiden har delelink, belønninger, antal og betingelser", () => {
  const b = referralBackFields(info({ referralsDone: 2, rewards: [{ type: "AMOUNT", value: "100" }] }));
  assert.deepEqual(b.map((x) => x.key), ["ref-share", "ref-rewards", "ref-count", "ref-terms", "ref-page"]);
  assert.ok(b[0]!.value.includes("?k=SARA-K8"));
  assert.equal(b[1]!.value, `100${NBSP}kr.`);
  assert.equal(b[2]!.value, "Du har henvist 2 venner.");
  assert.equal(referralBackFields(info({ termsLine: null })).some((x) => x.key === "ref-terms"), false);
});
