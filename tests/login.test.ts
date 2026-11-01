import { test } from "node:test";
import assert from "node:assert/strict";

// Login: koden i mailen, auto-login-tokenet efter oprettelse, hvem der maa
// logge ind, og noeglen til rate-limit. Ingen database (mayLogIn faar en falsk).

import { generateLoginCode, normalizeLoginCode, formatLoginCode, LOGIN_CODE_LENGTH } from "../src/lib/login-code";
import { createOnboardingToken, verifyOnboardingToken } from "../src/lib/onboarding-token";
import { mayLogIn } from "../src/lib/auth-policy";
import { limitKey } from "../src/lib/rate-limit";

// Begge laeses foerst ved kald, saa de kan saettes efter importen.
process.env.AUTH_SECRET = "test-secret-login";
process.env.SUPERADMIN_EMAIL = "chef@folka.dk";

test("login-kode: altid 6 cifre, ogsaa med foranstillede nuller", () => {
  for (let i = 0; i < 500; i++) {
    const code = generateLoginCode();
    assert.match(code, /^\d{6}$/);
    assert.equal(code.length, LOGIN_CODE_LENGTH);
  }
});

test("login-kode: mellemrum og bindestreg fjernes, visning deles i to", () => {
  assert.equal(normalizeLoginCode("123 456"), "123456");
  assert.equal(normalizeLoginCode(" 123-456 "), "123456");
  assert.equal(normalizeLoginCode(null), "");
  assert.equal(formatLoginCode("012345"), "012 345");
  assert.equal(formatLoginCode("123"), "123");
});

test("auto-login-token: gyldigt token giver brugerens id", () => {
  assert.deepEqual(verifyOnboardingToken(createOnboardingToken("user_1")), { uid: "user_1" });
});

test("auto-login-token: aendret bruger-id eller signatur afvises", () => {
  const [, exp, mac] = createOnboardingToken("user_1").split(".");
  assert.equal(verifyOnboardingToken(`user_2.${exp}.${mac}`), null);
  assert.equal(verifyOnboardingToken(`user_1.${exp}.${mac!.slice(0, -2)}xx`), null);
  assert.equal(verifyOnboardingToken(`user_1.${Number(exp) + 60_000}.${mac}`), null);
  assert.equal(verifyOnboardingToken("ikke-et-token"), null);
  assert.equal(verifyOnboardingToken(""), null);
});

test("auto-login-token: udloeber efter 15 minutter", (t) => {
  const token = createOnboardingToken("user_1");
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 14 * 60 * 1000);
  assert.deepEqual(verifyOnboardingToken(token), { uid: "user_1" });
  t.mock.method(Date, "now", () => now + 16 * 60 * 1000);
  assert.equal(verifyOnboardingToken(token), null);
});

test("auto-login-token: signeret med en anden hemmelighed afvises", () => {
  const token = createOnboardingToken("user_1");
  process.env.AUTH_SECRET = "en-anden-hemmelighed";
  try {
    assert.equal(verifyOnboardingToken(token), null);
  } finally {
    process.env.AUTH_SECRET = "test-secret-login";
  }
});

function fakeDb(emails: string[]) {
  return {
    user: {
      findUnique: async ({ where }: { where: { email: string } }) =>
        emails.includes(where.email) ? { id: "u" } : null,
    },
  } as unknown as Parameters<typeof mayLogIn>[1];
}

test("mayLogIn: kun kendte brugere og superadmin kan logge ind", async () => {
  const db = fakeDb(["ejer@butik.dk"]);
  assert.equal(await mayLogIn("ejer@butik.dk", db), true);
  assert.equal(await mayLogIn("chef@folka.dk", db), true, "superadmin uden bruger");
  assert.equal(await mayLogIn("fremmed@butik.dk", db), false);
  assert.equal(await mayLogIn("", db), false);
  assert.equal(await mayLogIn(null, db), false);
  assert.equal(await mayLogIn(undefined, db), false);
});

test("limitKey: IPv6 samles pr. /64, IPv4 og e-mails er uaendrede", () => {
  assert.equal(limitKey("2001:db8:1:2:aaaa:bbbb:cccc:dddd"), "2001:db8:1:2::/64");
  assert.equal(limitKey("2001:db8:1:2:1111:2222:3333:4444"), "2001:db8:1:2::/64");
  assert.equal(limitKey("203.0.113.7"), "203.0.113.7");
  assert.equal(limitKey("ejer@butik.dk"), "ejer@butik.dk");
});
