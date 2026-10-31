import { test } from "node:test";
import assert from "node:assert/strict";
import { ipRateKey } from "../src/lib/http";

// Lofter pr. afsender: IPv6 samles pr. /64, saa man ikke kan skifte adresse
// inden for sin egen tilslutning for at komme uden om loftet.

test("IPv4 bruges som den er", () => {
  assert.equal(ipRateKey("192.0.2.7"), "192.0.2.7");
});

test("IPv6 samles pr. /64", () => {
  const a = ipRateKey("2001:db8:1:2:aaaa:bbbb:cccc:dddd");
  const b = ipRateKey("2001:db8:1:2:1111:2222:3333:4444");
  assert.equal(a, b);
  assert.notEqual(a, ipRateKey("2001:db8:1:3::1"));
});

test("ingen IP giver en faelles noegle", () => {
  assert.equal(ipRateKey(null), "ukendt");
});
