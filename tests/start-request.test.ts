import { test } from "node:test";
import assert from "node:assert/strict";

import { startRequestSchema } from "../src/lib/start-request-schema";
import { superadminSignupRequestEmail } from "../src/lib/emails";

const base = { businessName: "Salon Nord", email: "sara@salon.dk" };

test("stempelkort alene: beloenning er stadig paakraevet (som foer)", () => {
  assert.equal(startRequestSchema.safeParse({ ...base, reward: "" }).success, false);
  const ok = startRequestSchema.safeParse({ ...base, reward: "10. klip gratis" });
  assert.equal(ok.success, true);
  assert.equal(ok.success && ok.data.wantsReferrals, false);
});

test("henvisninger: kraever henvisningsbeloenninger, stempelbeloenning er valgfri", () => {
  assert.equal(startRequestSchema.safeParse({ ...base, wantsReferrals: true }).success, false);
  const ok = startRequestSchema.safeParse({
    ...base,
    wantsReferrals: true,
    referralReward: "Vennen faar 100 kr., du faar et gratis klip",
  });
  assert.equal(ok.success, true);
  assert.equal(ok.success && ok.data.reward, "");
});

test("mail til superadmin naevner Henvisninger kun naar valgt", () => {
  const d = {
    businessName: "Salon Nord",
    reward: "",
    contactName: "(ingen)",
    email: "sara@salon.dk",
    phone: "(ingen)",
    createUrl: "https://x/app/ny-butik",
  };
  const plain = superadminSignupRequestEmail(d);
  assert.doesNotMatch(plain.subject, /Henvisninger/);
  const ref = superadminSignupRequestEmail({ ...d, referralReward: "100 kr. <b>og</b> klip" });
  assert.match(ref.subject, /\(Henvisninger\)/);
  assert.match(ref.text, /Henvisninger: 100 kr\./);
  assert.match(ref.html, /&lt;b&gt;og&lt;\/b&gt;/);
});
