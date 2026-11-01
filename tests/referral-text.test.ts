import { test } from "node:test";
import assert from "node:assert/strict";

import {
  rewardPhrase,
  redeemLabel,
  redeemReceipt,
  firstName,
  referralShareUrl,
  referralShareText,
} from "../src/lib/referral-text";

const NBSP = " ";

test("beloenning: beloeb og stempler med haardt mellemrum", () => {
  assert.equal(rewardPhrase("AMOUNT", "100"), `100${NBSP}kr.`);
  assert.equal(rewardPhrase("PERCENT", "20"), `20${NBSP}% rabat`);
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
    "https://stemplet.alius.dk/k/sara-salon/ven/SARA-K8",
  );
  assert.equal(
    referralShareText("Sara Salon", `100${NBSP}kr.`),
    `Jeg giver dig 100${NBSP}kr. hos Sara Salon. Hent kortet her, så ligger rabatten klar til dit første besøg:`,
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
  referralOnlyFrontFields,
} from "../src/lib/wallet/referral-fields";

const info = (over: Partial<ReferralPassInfo> = {}): ReferralPassInfo => ({
  code: "SARA-K8",
  shareUrl: "https://stemplet.alius.dk/henvisninger/sara-salon?k=SARA-K8",
  pageUrl: "https://stemplet.alius.dk/henvisninger/sara-salon",
  termsLine: "Gælder ved første besøg over 300 kr.",
  newCustomerReward: `100${NBSP}kr.`,
  referrerReward: "gratis klip",
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

test("wallet: forsiden opfordrer til at dele og viser til gode, altid begge felter", () => {
  const f = referralFrontFields(info());
  assert.deepEqual(f.map((x) => x.key), ["ref-code", "ref-owed"]);
  assert.equal(f[0]!.label, "DEL MED EN VEN");
  assert.equal(f[0]!.value, `Giv 100${NBSP}kr.`);
  // Intet til gode endnu: koden staar i feltet (kort uden navn) ...
  assert.equal(f[1]!.label, "DIN KODE");
  assert.equal(f[1]!.value, "SARA-K8");
  assert.equal(f[1]!.changeMessage, undefined);
  // ... og ellers kundens navn, ikke "Intet endnu".
  const named = referralFrontFields(info({ holderName: "Mette" }))[1]!;
  assert.equal(named.label, "NAVN");
  assert.equal(named.value, "Mette");
  // Samme felt bliver til "TIL GODE", naar der kommer en belønning (saa iPhone viser beskeden).
  const owed = referralFrontFields(info({ holderName: "Mette", rewards: [{ type: "AMOUNT", value: "100" }], announce: true }))[1]!;
  assert.equal(owed.key, "ref-owed");
  assert.equal(owed.label, "TIL GODE");
  assert.ok(owed.changeMessage);
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
  assert.deepEqual(b.map((x) => x.key), ["ref-how", "ref-share", "ref-rewards", "ref-count", "ref-terms", "ref-page"]);
  assert.ok(b[0]!.value.includes("koden SARA-K8"));
  assert.ok(b[0]!.value.includes("du får gratis klip"));
  assert.ok(b[1]!.value.includes("?k=SARA-K8"));
  assert.equal(b[2]!.value, `100${NBSP}kr.`);
  assert.equal(b[3]!.value, "Du har henvist 2 venner.");
  assert.equal(referralBackFields(info({ termsLine: null })).some((x) => x.key === "ref-terms"), false);
});

// ── Kode tastet af en kunde ──────────────────────────────────────────

import { referralCodeCandidates } from "../src/lib/referral-code";

test("kode: tolerant over for mellemrum, tankestreg, smaa bogstaver og manglende bindestreg", () => {
  assert.deepEqual(referralCodeCandidates("SARA-FU"), ["SARA-FU", "SAR-AFU"]);
  assert.ok(referralCodeCandidates("sara fu").includes("SARA-FU"));
  assert.ok(referralCodeCandidates(" Sara\u2013Fu ").includes("SARA-FU"));
  assert.ok(referralCodeCandidates("sarafu").includes("SARA-FU"));
  assert.ok(referralCodeCandidates("SOEREN-AB3").includes("SOEREN-AB3"));
  assert.ok(referralCodeCandidates("soerenab3").includes("SOEREN-AB3"));
  assert.deepEqual(referralCodeCandidates("   "), []);
});

test("wallet uden Stemplet: opfordringen er primaerfelt, din beloenning og til gode under", () => {
  const f = referralOnlyFrontFields(info({ rewards: [{ type: "SERVICE", value: "Gratis klip" }], announce: true, referralsDone: 1 }));
  assert.deepEqual(
    f.primary.map((x) => [x.key, x.value]),
    [["ref-code", `Giv 100${NBSP}kr.`]],
  );
  assert.deepEqual(
    f.secondary.map((x) => [x.key, x.value]),
    [
      ["ref-you", "gratis klip"],
      ["ref-owed", "Gratis klip"],
    ],
  );
  // Beskeden ved en ny beloenning foelger med, som paa stempelkortet.
  assert.match(f.secondary[1]!.changeMessage ?? "", /%@/);
});

import { referralSummaryLine } from "../src/lib/overview-text";

test("hjem uden Stemplet: linjen taler om nye kunder, ikke stempler", () => {
  assert.match(referralSummaryLine({ totalCustomers: 0, newThisMonth: 0, waiting: 0 }), /henvisningsside/);
  const line = referralSummaryLine({ totalCustomers: 14, newThisMonth: 1, waiting: 2 });
  assert.equal(line, "Du har 14 kunder. 1 ny kunde via henvisninger denne måned. 2 venter på første besøg.");
  assert.doesNotMatch(line, /stempel/i);
});

import { parseRewardInput } from "../src/lib/referral-text";

test("oprettelse: beloenning som fri tekst bliver beloeb eller behandling", () => {
  assert.deepEqual(parseRewardInput("150 kr."), { type: "AMOUNT", value: "150" });
  assert.deepEqual(parseRewardInput("1.000 kr"), { type: "AMOUNT", value: "1000" });
  assert.deepEqual(parseRewardInput("200,-"), { type: "AMOUNT", value: "200" });
  assert.deepEqual(parseRewardInput("100 kr. rabat"), { type: "AMOUNT", value: "100" });
  assert.deepEqual(parseRewardInput("75"), { type: "AMOUNT", value: "75" });
  assert.deepEqual(parseRewardInput("gratis vask"), { type: "SERVICE", value: "gratis vask" });
  assert.deepEqual(parseRewardInput("10 % rabat"), { type: "PERCENT", value: "10" });
  assert.deepEqual(parseRewardInput("20%"), { type: "PERCENT", value: "20" });
  assert.deepEqual(parseRewardInput("150 %"), { type: "SERVICE", value: "150 %" });
  assert.equal(parseRewardInput("   "), null);
});

test("stempel-beloenning staar som en handling ved kassen, ikke som givet", () => {
  assert.equal(redeemLabel("STAMPS", "3"), `Giv 3${NBSP}stempler`);
  assert.equal(redeemLabel("AMOUNT", "100"), `Indløs 100${NBSP}kr.`);
  const r = redeemReceipt("STAMPS", "3", "Sara");
  assert.equal(r.title, `Giv 3${NBSP}stempler på kortet`);
  assert.match(r.text, /Scan kortet/);
  assert.deepEqual(redeemReceipt("SERVICE", "Gratis klip", null), {
    title: "Gratis klip er indløst",
    text: "Kunden har fået sin belønning.",
  });
});
