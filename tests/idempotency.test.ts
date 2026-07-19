import { test } from "node:test";
import assert from "node:assert/strict";
import { runOnce, IdempotencyInFlight } from "../src/lib/idempotency";

// In-memory fake af det Redis-udsnit runOnce bruger: set (NX+TTL), get, del.
function makeFakeStore() {
  const kv = new Map<string, unknown>();
  return {
    async set(key: string, value: unknown, opts: { nx?: boolean; ex: number }) {
      if (opts?.nx && kv.has(key)) return null; // NX: kun hvis den ikke findes
      kv.set(key, value);
      return "OK";
    },
    async get(key: string) {
      return kv.has(key) ? kv.get(key) : null;
    },
    async del(key: string) {
      kv.delete(key);
      return 1;
    },
    _kv: kv,
  };
}

test("runOnce koerer kun een gang for samme noegle (retry faar foerste resultat)", async () => {
  const store = makeFakeStore();
  let runs = 0;
  const run = async () => {
    runs += 1;
    return { stamp: runs };
  };

  const first = await runOnce("k1", run, store);
  const second = await runOnce("k1", run, store); // retry med samme noegle

  assert.deepEqual(first, { stamp: 1 });
  assert.deepEqual(second, { stamp: 1 }, "retry faar FOERSTE resultat, ikke et nyt");
  assert.equal(runs, 1, "run blev kun koert een gang");
});

test("samtidigt in-flight forsoeg koerer IKKE igen (kaster IdempotencyInFlight)", async () => {
  const store = makeFakeStore();
  // Simulér at et andet kald har claimet noeglen og stadig koerer (done:false).
  await store.set("idem:k2", { done: false }, { ex: 600 });

  let runs = 0;
  await assert.rejects(
    () =>
      runOnce(
        "k2",
        async () => {
          runs += 1;
          return 1;
        },
        store,
      ),
    (e) => e instanceof IdempotencyInFlight,
  );
  assert.equal(runs, 0, "handlingen blev IKKE koert, mens et forsoeg er i gang");
});

test("fejler run, frigives noeglen, saa et aegte nyt forsoeg kan koere", async () => {
  const store = makeFakeStore();
  await assert.rejects(
    () =>
      runOnce(
        "k3",
        async () => {
          throw new Error("stempel-fejl");
        },
        store,
      ),
    /stempel-fejl/,
  );
  assert.equal(store._kv.has("idem:k3"), false, "noeglen blev frigivet ved fejl");

  // Nyt forsoeg med samme noegle koerer nu (ikke blokeret af 'processing').
  let ran = false;
  const r = await runOnce(
    "k3",
    async () => {
      ran = true;
      return 42;
    },
    store,
  );
  assert.equal(ran, true);
  assert.equal(r, 42);
});

test("uden noegle koeres altid (fail-open)", async () => {
  const store = makeFakeStore();
  let runs = 0;
  const run = async () => {
    runs += 1;
    return runs;
  };
  await runOnce(undefined, run, store);
  await runOnce(undefined, run, store);
  assert.equal(runs, 2, "uden idempotens-noegle koeres hver gang");
});
