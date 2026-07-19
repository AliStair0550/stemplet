import { test } from "node:test";
import assert from "node:assert/strict";
import { passColors } from "../src/lib/wallet/pass";

// Farve- og kontrast-logikken for Wallet-passet (ren funktion, ingen certs/I/O).

test("passColors: butikkens egen primaryColor slaar igennem paa baggrunden", () => {
  assert.equal(passColors("#123B47", "#FFFFFF").backgroundColor, "rgb(18, 59, 71)");
});

test("passColors: tom eller ugyldig farve falder tilbage til Stemplets #2A1A10", () => {
  assert.equal(passColors("", "#FFFFFF").backgroundColor, "rgb(42, 26, 16)");
  assert.equal(
    passColors("ikke-en-farve", "#FFFFFF").backgroundColor,
    "rgb(42, 26, 16)",
  );
});

test("passColors: ulaeselig tekstfarve falder tilbage til kontrast", () => {
  // Hvid tekst paa hvid baggrund er ulaeselig -> foregroundColor bliver moerk.
  assert.equal(passColors("#FFFFFF", "#FFFFFF").foregroundColor, "rgb(26, 26, 26)");
});

test("passColors: laesbar tekstfarve beholdes", () => {
  // Lys tekst paa moerk espresso-baggrund er laesbar -> beholdes som den er.
  assert.equal(
    passColors("#2A1A10", "#F6EEE4").foregroundColor,
    "rgb(246, 238, 228)",
  );
});

test("passColors: labelColor er daempet (mellem tekst og baggrund)", () => {
  const c = passColors("#2A1A10", "#F6EEE4");
  assert.notEqual(c.labelColor, c.foregroundColor, "ikke ren tekstfarve");
  assert.notEqual(c.labelColor, c.backgroundColor, "ikke ren baggrundsfarve");
});
