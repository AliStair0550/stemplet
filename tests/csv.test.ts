import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell } from "../src/lib/csv";

test("csvCell neutraliserer formel-tegn i starten", () => {
  // = + - @ skal foranstilles ' saa regnearket ikke udfoerer dem.
  assert.equal(csvCell('=HYPERLINK("http://x")'), "\"'=HYPERLINK(\"\"http://x\"\")\"");
  assert.equal(csvCell("+1"), "'+1");
  assert.equal(csvCell("-cmd"), "'-cmd");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvCell("\tTAB"), "'\tTAB");
});

test("csvCell roerer ikke almindelig tekst", () => {
  assert.equal(csvCell("Milano Pizza"), "Milano Pizza");
  // @ midt i en mail er ikke i starten, saa den roeres ikke.
  assert.equal(csvCell("hej@alius.dk"), "hej@alius.dk");
});

test("csvCell quoter felter med komma/anfoerselstegn/linjeskift", () => {
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('sig "hej"'), '"sig ""hej"""');
  assert.equal(csvCell("linje1\nlinje2"), '"linje1\nlinje2"');
});

test("csvCell laeser tal som tal (uden ' selv ved negativt)", () => {
  assert.equal(csvCell(5), "5");
  assert.equal(csvCell(-3), "-3");
  assert.equal(csvCell(5, { alwaysQuote: true }), '"5"');
});

test("csvCell med alwaysQuote quoter altid strenge", () => {
  assert.equal(csvCell("Milano", { alwaysQuote: true }), '"Milano"');
  assert.equal(csvCell(null, { alwaysQuote: true }), '""');
});
