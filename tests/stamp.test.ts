import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://u:p@localhost:5432/db";

import {
  createCardholderAtomically,
  undoLastStamp,
  computeScanIncrement,
} from "../src/lib/stamp";

type CapDb = Parameters<typeof createCardholderAtomically>[2];
type UndoDb = Parameters<typeof undoLastStamp>[1];

// ── DAT-3: kunde-loft haandhaeves atomisk, og optaellingen springes over naar ──
// loftet er slaaet fra. (Selve atomiciteten ved graensen sikres af den per-butik
// advisory-laas i en Postgres-transaktion; her testes beslutnings-logikken.)

function makeCapDb(opts: { count: number; onCount?: () => void }) {
  let created: { id: string; serial: string; authToken: string } | null = null;
  const db = {
    customerCard: {
      async create({ data }: { data: { serial: string; authToken: string } }) {
        created = { id: "cc1", serial: data.serial, authToken: data.authToken };
        return created;
      },
      async count() {
        opts.onCount?.();
        return opts.count;
      },
    },
    async $queryRaw() {
      return []; // advisory-laas: no-op i fake
    },
    async $transaction(fn: (tx: unknown) => Promise<unknown>) {
      return fn(db); // tx = fake-db'en selv
    },
  };
  return { db: db as unknown as CapDb, getCreated: () => created };
}

test("intet kunde-loft: opretter uden at taelle (ingen spildt count)", async () => {
  let counted = false;
  const { db, getCreated } = makeCapDb({
    count: 999,
    onCount: () => (counted = true),
  });
  const res = await createCardholderAtomically("b1", "card1", db);
  assert.ok(res, "kortet blev oprettet");
  assert.equal(counted, false, "ingen optaelling");
  assert.ok(getCreated());
});

// ── DAT-2: undoLastStamp traekker RELATIVT fra den levende taeller, ikke ──
// absolut fra et forældet snapshot (ellers tabes et samtidigt stempel).

test("undoLastStamp traekker relativt fra (mister ikke et samtidigt stempel)", async () => {
  // Snapshot (findUnique) siger stamps=5, men den LEVENDE raekke staar paa 6, som
  // om et stempel naaede ind lige efter snapshottet. Relativ decrement -> 5. Den
  // gamle absolutte skrivning ville saette 4 og dermed TABE det samtidige stempel.
  const live = { stamps: 6, lifetimeStamps: 6 };
  let findFirstCalls = 0;
  const db = {
    async $queryRaw() {
      return []; // FOR UPDATE: no-op i fake
    },
    async $transaction(fn: (tx: unknown) => Promise<unknown>) {
      return fn(db);
    },
    customerCard: {
      async findUnique() {
        // Forældet snapshot (5), ikke den levende vaerdi (6).
        return {
          id: "cc1",
          serial: "S1",
          stamps: 5,
          lifetimeStamps: 5,
          card: { stampsRequired: 10, businessId: "b1" },
        };
      },
      async update({
        data,
      }: {
        data: {
          stamps: number | { decrement: number };
          lifetimeStamps: number | { decrement: number };
        };
      }) {
        // Modellerer baade relativ (decrement) og absolut (tal) skrivning, saa en
        // regression til absolut skrivning faanges.
        const s = data.stamps;
        live.stamps = typeof s === "object" ? live.stamps - s.decrement : s;
        const l = data.lifetimeStamps;
        live.lifetimeStamps =
          typeof l === "object" ? live.lifetimeStamps - l.decrement : l;
        return { stamps: live.stamps, lifetimeStamps: live.lifetimeStamps };
      },
    },
    stamp: {
      async findFirst() {
        findFirstCalls += 1;
        // 1. kald: sidste stempel (multiplier 1). 2. kald: forrige (ingen).
        return findFirstCalls === 1
          ? { id: "s-last", multiplier: 1, createdAt: new Date() }
          : null;
      },
      async delete() {
        return { id: "s-last" };
      },
    },
    // Ingen indloesning endnu: fortryd er tilladt.
    redemption: {
      async findFirst() {
        return null;
      },
    },
    auditLog: {
      async create() {
        return {};
      },
    },
  };

  const res = await undoLastStamp(
    { customerCardId: "cc1" },
    db as unknown as UndoDb,
  );

  assert.equal(res.stamps, 5, "stamps trukket RELATIVT fra 6 -> 5 (ikke absolut 4)");
  assert.equal(res.lifetimeStamps, 5, "livstid trukket relativt fra 6 -> 5");
  assert.equal(live.stamps, 5, "den levende raekke er 5, det samtidige stempel bevaret");
});

// ── KOD-1: kampagne/multiplier-beregning (ren funktion, uden database) ──

const day = (d: number) => new Date(2026, 0, d);
const jan15 = day(15);

test("computeScanIncrement: uden kampagne giver 1 pr. scanning", () => {
  const r = computeScanIncrement([], jan15);
  assert.equal(r.baseIncrement, 1);
  assert.equal(r.scanIncrement, 1);
  assert.equal(r.hasWelcome, false);
});

test("computeScanIncrement: aktiv dobbeltstempel fordobler", () => {
  const camps = [{ type: "DOUBLE_STAMP", startsAt: day(1), endsAt: day(31) }];
  const r = computeScanIncrement(camps, jan15);
  assert.equal(r.baseIncrement, 2);
  assert.equal(r.scanIncrement, 2);
});

test("computeScanIncrement: dobbeltstempel gange antal (3 kaffe = 6)", () => {
  const camps = [{ type: "DOUBLE_STAMP", startsAt: day(1), endsAt: day(31) }];
  assert.equal(computeScanIncrement(camps, jan15, 3).scanIncrement, 6);
});

test("computeScanIncrement: udloebet eller fremtidig kampagne taeller ikke", () => {
  const expired = [{ type: "DOUBLE_STAMP", startsAt: day(1), endsAt: day(10) }];
  const future = [{ type: "DOUBLE_STAMP", startsAt: day(20), endsAt: day(31) }];
  assert.equal(computeScanIncrement(expired, jan15).baseIncrement, 1);
  assert.equal(computeScanIncrement(future, jan15).baseIncrement, 1);
});

test("computeScanIncrement: velkomstbonus markeres, men fordobler ikke scanningen", () => {
  const camps = [{ type: "WELCOME_BONUS", startsAt: day(1), endsAt: day(31) }];
  const r = computeScanIncrement(camps, jan15);
  assert.equal(r.hasWelcome, true);
  assert.equal(r.baseIncrement, 1);
});

test("computeScanIncrement: antal klampes til 1..20 (og gulvet)", () => {
  assert.equal(computeScanIncrement([], jan15, 0).qty, 1);
  assert.equal(computeScanIncrement([], jan15, -5).qty, 1);
  assert.equal(computeScanIncrement([], jan15, 25).qty, 20);
  assert.equal(computeScanIncrement([], jan15, 2.9).qty, 2);
});

// ── KOD-1: cross-tenant guard skal vaere til stede i stempel-ruterne ──
// Regressionsvaern: fjerner nogen businessId-tjekket, kan bruger A stemple paa
// bruger B's kort. Vi laeser ruternes kildekode og kraever guarden (samme moenster
// som den eksisterende /s/[token]-sideeffekt-test).

test("stempel-ruter tjekker businessId FOER de stempler (cross-tenant guard)", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const routes = [
    "../src/app/api/v1/stamp/route.ts",
    "../src/app/api/staff/stamp/route.ts",
    "../src/app/api/v1/redeem/route.ts",
    "../src/app/api/staff/redeem/route.ts",
    "../src/app/api/staff/unstamp/route.ts",
  ];
  for (const rel of routes) {
    const src = readFileSync(join(here, rel), "utf8");
    // Kortet slaas op med butikken i filteret (cardIdInBusiness), og ruten
    // stopper, hvis kortet ikke hoerer til butikken.
    assert.match(src, /cardIdInBusiness\(/, `${rel} mangler cross-tenant guard (cardIdInBusiness)`);
    assert.match(src, /if \(!ccId\)/, `${rel} skal stoppe, naar kortet ikke hoerer til butikken`);
    assert.match(src, /customerCardId: ccId/, `${rel} skal bruge det tjekkede kort-id`);
  }
  // Selve tjekket: butikken er en del af opslaget.
  const lib = readFileSync(join(here, "../src/lib/stamp.ts"), "utf8");
  assert.match(lib, /where: \{ serial, card: \{ businessId \} \}/, "cardIdInBusiness skal filtrere paa butikken");
});
