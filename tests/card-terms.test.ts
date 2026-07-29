import { test } from "node:test";
import assert from "node:assert/strict";
import { cardDesignSchema } from "../src/lib/validation";

// Kort-design uden betingelser (betingelser er valgfri).
const base = {
  stampsRequired: 10,
  rewardText: "10. kop er gratis",
  stampIcon: "coffee",
  primaryColor: "#2A1A10",
  textColor: "#F6EEE4",
};

test("terms: gyldig tekst bevares (trimmet)", () => {
  const r = cardDesignSchema.safeParse({
    ...base,
    terms: "  Gælder kun ved køb af kaffe.  ",
  });
  assert.ok(r.success);
  assert.equal(r.data.terms, "Gælder kun ved køb af kaffe.");
});

test("terms: udeladt felt er gyldigt (valgfrit)", () => {
  const r = cardDesignSchema.safeParse(base);
  assert.ok(r.success);
  assert.equal(r.data.terms, undefined);
});

test("terms: null er gyldigt (slaaet fra)", () => {
  const r = cardDesignSchema.safeParse({ ...base, terms: null });
  assert.ok(r.success);
  assert.equal(r.data.terms, null);
});

test("terms: kun mellemrum -> tom -> behandles som ingen (|| null)", () => {
  const r = cardDesignSchema.safeParse({ ...base, terms: "    " });
  assert.ok(r.success);
  // Gem-stierne bruger `parsed.data.terms || null`, saa "" bliver til null.
  assert.equal(r.data.terms || null, null);
});

test("terms: for lang (>180) afvises", () => {
  const r = cardDesignSchema.safeParse({ ...base, terms: "x".repeat(181) });
  assert.equal(r.success, false);
});
