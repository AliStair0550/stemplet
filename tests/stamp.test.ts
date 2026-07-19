import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://u:p@localhost:5432/db";

import { createCardholderAtomically, undoLastStamp } from "../src/lib/stamp";
import { PLAN_LIMITS } from "../src/lib/plans";

type CapDb = Parameters<typeof createCardholderAtomically>[3];
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

test("kunde-loft FRA: opretter uden at taelle (SKA-6, ingen spildt count)", async () => {
  // Default: PLAN_LIMITS.FREE.maxCustomers === null -> loft slaaet fra.
  let counted = false;
  const { db, getCreated } = makeCapDb({
    count: 999,
    onCount: () => (counted = true),
  });
  const res = await createCardholderAtomically("FREE", "b1", "card1", db);
  assert.ok(res, "kortet blev oprettet");
  assert.equal(counted, false, "ingen optaelling naar loftet er slaaet fra");
  assert.ok(getCreated());
});

test("kunde-loft AKTIVT ved graensen: afviser (null, intet kort oprettet)", async () => {
  const orig = PLAN_LIMITS.FREE.maxCustomers;
  PLAN_LIMITS.FREE.maxCustomers = 2;
  try {
    const { db, getCreated } = makeCapDb({ count: 2 }); // allerede ved loftet
    const res = await createCardholderAtomically("FREE", "b1", "card1", db);
    assert.equal(res, null, "ved loftet oprettes intet nyt kort");
    assert.equal(getCreated(), null, "create blev aldrig kaldt");
  } finally {
    PLAN_LIMITS.FREE.maxCustomers = orig;
  }
});

test("kunde-loft AKTIVT under graensen: opretter", async () => {
  const orig = PLAN_LIMITS.FREE.maxCustomers;
  PLAN_LIMITS.FREE.maxCustomers = 3;
  try {
    const { db, getCreated } = makeCapDb({ count: 2 }); // 2 < 3
    const res = await createCardholderAtomically("FREE", "b1", "card1", db);
    assert.ok(res, "under loftet oprettes kortet");
    assert.ok(getCreated());
  } finally {
    PLAN_LIMITS.FREE.maxCustomers = orig;
  }
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
