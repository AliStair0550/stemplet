import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { posterFields, featuredActionsFor } from "../src/lib/wallet/poster";
import { renderPosterArtwork, POSTER_W, POSTER_H } from "../src/lib/wallet/artwork";
import type { ReferralPassInfo } from "../src/lib/wallet/referral-fields";

const referral: ReferralPassInfo = {
  code: "SARA-K7",
  shareUrl: "https://x/henvisninger/salon?k=SARA-K7",
  pageUrl: "https://x/henvisninger/salon",
  termsLine: null,
  newCustomerReward: "100 kr.",
  referrerReward: "gratis klip",
  referralsDone: 1,
  rewards: [{ type: "SERVICE", value: "Gratis klip" }],
  announce: true,
};
const vals = (f: { value: string }[]) => f.map((x) => x.value);

test("plakat: kun Stemplet viser stempler, beloenning og hvor mange der mangler", () => {
  const f = posterFields({ stamps: 3, required: 10, rewardText: "Gratis klip", stampsEnabled: true, referral: null });
  assert.deepEqual(vals(f.header), ["3/10"]);
  assert.deepEqual(vals(f.primary), ["Gratis klip"]);
  assert.deepEqual(vals(f.footer), ["7 stempler til næste belønning"]);
});

test("plakat: begge viser stempler, koden og til gode med besked", () => {
  const f = posterFields({ stamps: 3, required: 10, rewardText: "Gratis klip", stampsEnabled: true, referral });
  assert.deepEqual(vals(f.header), ["3/10"]);
  assert.deepEqual(vals(f.primary), ["SARA-K7", "Gratis klip"]);
  assert.match(f.primary[1]!.changeMessage ?? "", /%@/);
});

test("plakat: kun Henvisninger viser til gode oeverst og koden stort", () => {
  const f = posterFields({ stamps: 0, required: 10, rewardText: "x", stampsEnabled: false, referral });
  assert.deepEqual(vals(f.header), ["Gratis klip"]);
  assert.deepEqual(vals(f.primary), ["SARA-K7"]);
  assert.match(f.footer[0]!.value, /Din ven får 100/);
});

test("knapper: Apples typer, kun det der kan bruges, hoejst to", () => {
  const a = featuredActionsFor({
    actions: ["henvis", "book", "beloenninger"],
    bookingUrl: "https://planway.com/salon",
    referralPageUrl: "https://x/henvisninger/salon",
    cardPageUrl: "https://x/k/salon",
  });
  assert.deepEqual(a.map((x) => x.type), ["viewOffersRewards", "bookAppointment"]);
  const b = featuredActionsFor({ actions: ["book", "henvis", "beloenninger"], bookingUrl: null, referralPageUrl: null, cardPageUrl: "https://x/k/salon" });
  assert.deepEqual(b, [{ identifier: "beloenninger", type: "membershipBenefits", url: "https://x/k/salon" }]);
});

test("plakatbillede: 1x, 2x og 3x i Apples maal for alle stilarter", async () => {
  for (const style of ["color", "pattern", "stamps"] as const) {
    const a = await renderPosterArtwork({ style, primaryColor: "#2a1a10", textColor: "#f6eee4", stampIcon: "scissors", stamps: 3, required: 10, photo: null });
    const m3 = await sharp(a.x3).metadata();
    assert.equal(m3.width, POSTER_W * 3);
    assert.equal(m3.height, POSTER_H * 3);
    assert.equal((await sharp(a.x1).metadata()).width, POSTER_W);
  }
});
