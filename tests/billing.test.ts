import { test } from "node:test";
import assert from "node:assert/strict";

// Superadmin-modtager, saa taerskel-mails har nogen at gaa til. Laeses FOERST naar
// superadminRecipients() kaldes (runtime), saa det er nok at saette den her.
process.env.SUPERADMIN_EMAIL = "admin@stemplet.dk";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://u:p@localhost:5432/db";

import {
  processTrialMilestones,
  sweepPendingThresholdEmails,
} from "../src/lib/billing";

const DAY = 86_400_000;
// Fast "nu" efter relanceringen (taelleren starter 1. december 2026).
const NOW = new Date("2027-08-01T10:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

// De to typer, funktionerne forventer for db og mailer. Vi udleder dem, saa vi
// ikke skal importere selve prisma-vaerdien (og konstruere den).
type DbArg = Parameters<typeof sweepPendingThresholdEmails>[0];
type MailArg = Parameters<typeof sweepPendingThresholdEmails>[1];

// ── In-memory fake af det lille Prisma-udsnit, billing bruger ──────────
// updateMany modellerer Postgres' ATOMISKE guardede update: tjek + skriv sker
// synkront FOER retur, saa to samtidige kald ikke begge kan vinde. Det er praecis
// den garanti fire-once hviler paa. (Vi tester vores kode-moenster; at Postgres
// faktisk er atomisk stoler vi paa.)
type BizRow = {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  cardholderWarnedAt: Date | null;
  cardholderWarnEmailSentAt: Date | null;
  reached100At: Date | null;
  reached100EmailSentAt: Date | null;
  proApprovedAt: Date | null;
  proPriceKr: number;
  proPriceUntil: Date | null;
  memberships: { user: { email: string | null } }[];
  cards: { id: string }[];
};

function matchWhere(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(where)) {
    const cur = row[k];
    if (k === "OR" && Array.isArray(v)) {
      if (!v.some((w) => matchWhere(row, w as Record<string, unknown>))) return false;
      continue;
    }
    if (v && typeof v === "object" && "lte" in v) {
      if (!(cur instanceof Date) || cur.getTime() > (v as { lte: Date }).lte.getTime()) return false;
      continue;
    }
    if (v === null) {
      if (cur != null) return false;
    } else if (v && typeof v === "object" && "not" in v) {
      const not = (v as { not: unknown }).not;
      if (not === null) {
        if (cur == null) return false;
      } else if (cur === not) {
        return false;
      }
    } else if (cur !== v) {
      return false;
    }
  }
  return true;
}

function makeFakeDb(
  seed: (Omit<BizRow, "cards"> & { cardholderCount: number })[],
) {
  const businesses = new Map<string, BizRow>();
  const cardholderCounts = new Map<string, number>();
  const cardOwner = new Map<string, string>(); // cardId -> businessId
  for (const b of seed) {
    const { cardholderCount, ...rest } = b;
    const cardId = `${b.id}-card`;
    businesses.set(b.id, { ...rest, cards: [{ id: cardId }] });
    cardholderCounts.set(b.id, cardholderCount);
    cardOwner.set(cardId, b.id);
  }

  // EmailLog i hukommelsen: unik pr. (butik, slags, modtager) som i databasen.
  type LogRow = { id: string; businessId: string; kind: string; recipient: string; sentAt: Date | null; createdAt: Date };
  const logs = new Map<string, LogRow>();
  const logKey = (k: { businessId: string; kind: string; recipient: string }) => `${k.businessId}|${k.kind}|${k.recipient}`;
  const client = {
    emailLog: {
      async create({ data }: { data: { businessId: string; kind: string; recipient: string } }) {
        const k = logKey(data);
        if (logs.has(k)) throw Object.assign(new Error("unique"), { code: "P2002" });
        const row = { ...data, id: k, sentAt: null, createdAt: new Date() };
        logs.set(k, row);
        return { id: row.id };
      },
      async findUnique({ where }: { where: { businessId_kind_recipient: { businessId: string; kind: string; recipient: string } } }) {
        return logs.get(logKey(where.businessId_kind_recipient)) ?? null;
      },
      async updateMany() {
        return { count: 0 };
      },
      async update({ where, data }: { where: { id: string }; data: Partial<LogRow> }) {
        const row = logs.get(where.id)!;
        Object.assign(row, data);
        return row;
      },
      async delete({ where }: { where: { id: string } }) {
        logs.delete(where.id);
        return null;
      },
    },
    business: {
      async findUnique({ where }: { where: { id: string } }) {
        const row = businesses.get(where.id);
        return row ? { ...row } : null; // snapshot-kopi
      },
      async updateMany({
        where,
        data,
      }: {
        where: Record<string, unknown> & { id: string };
        data: Record<string, unknown>;
      }) {
        const row = businesses.get(where.id);
        if (!row || !matchWhere(row, where)) return { count: 0 };
        Object.assign(row, data); // atomisk skrivning paa LIVE-raekken
        return { count: 1 };
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) {
        const row = businesses.get(where.id);
        if (row) Object.assign(row, data);
        return row ? { ...row } : null;
      },
      async findMany({ where }: { where?: Record<string, unknown> }) {
        const out: { id: string }[] = [];
        for (const row of businesses.values()) {
          if (!where || matchWhere(row, where)) out.push({ id: row.id });
        }
        return out;
      },
    },
    card: {
      async findMany({ where }: { where: { businessId: string } }) {
        const ids: { id: string }[] = [];
        for (const [cardId, bizId] of cardOwner) {
          if (bizId === where.businessId) ids.push({ id: cardId });
        }
        return ids;
      },
    },
    customerCard: {
      async count({ where }: { where: { cardId: { in: string[] } } }) {
        let total = 0;
        const counted = new Set<string>();
        for (const cardId of where.cardId.in) {
          const bizId = cardOwner.get(cardId);
          if (bizId && !counted.has(bizId)) {
            counted.add(bizId);
            total += cardholderCounts.get(bizId) ?? 0;
          }
        }
        return total;
      },
    },
  };

  return { client: client as unknown as DbArg, businesses };
}

function baseRow(
  over: Partial<Omit<BizRow, "cards">> & {
    id: string;
    slug: string;
    cardholderCount?: number;
  },
): Omit<BizRow, "cards"> & { cardholderCount: number } {
  return {
    name: "Butik",
    // I varsel-vinduet (gratis i ca. 91 dage, varsel 14 dage foer).
    createdAt: daysAgo(80),
    cardholderWarnedAt: null,
    cardholderWarnEmailSentAt: null,
    reached100At: null,
    reached100EmailSentAt: null,
    proApprovedAt: null,
    proPriceKr: 49,
    proPriceUntil: null,
    memberships: [{ user: { email: "ejer@butik.dk" } }],
    cardholderCount: 0,
    ...over,
  };
}

// ── Fejlscenarie 1: mail fejler ved krydsning -> sweepet samler varslet op ──

test("sweep genopsamler varslet efter et mail-blip", async () => {
  // Varslet ER givet (Warned sat), men mailen fejlede (EmailSent stadig null).
  const { client, businesses } = makeFakeDb([
    baseRow({
      id: "b1",
      slug: "kaffebar",
      name: "Kaffebar",
      cardholderWarnedAt: new Date(),
      cardholderCount: 85,
    }),
  ]);

  // Foerste sweep: mailer FEJLER. Intet leveres, sent-flag forbliver null.
  let attempts = 0;
  const failing: MailArg = async () => {
    attempts += 1;
    throw new Error("resend nede");
  };
  const r1 = await sweepPendingThresholdEmails(client, failing, NOW);
  assert.equal(r1.warns, 0, "intet varsel talt som leveret");
  assert.ok(attempts > 0, "mailen blev forsoegt");
  assert.equal(
    businesses.get("b1")!.cardholderWarnEmailSentAt,
    null,
    "sent-flag stadig null, saa sweepet vil proeve igen",
  );

  // Anden sweep: mailer VIRKER. Varslet leveres, sent-flag saettes.
  let delivered = 0;
  const ok: MailArg = async () => {
    delivered += 1;
    return true;
  };
  const r2 = await sweepPendingThresholdEmails(client, ok, NOW);
  assert.equal(r2.warns, 1, "varslet blev genopsamlet og leveret");
  assert.ok(delivered >= 1, "mailen blev sendt ved retry");
  assert.notEqual(
    businesses.get("b1")!.cardholderWarnEmailSentAt,
    null,
    "sent-flag sat efter bekraeftet levering",
  );

  // Tredje sweep: intet tilbage at gensende (idempotent, ingen dubletter).
  const r3 = await sweepPendingThresholdEmails(client, ok, NOW);
  assert.equal(r3.warns, 0, "ingen dubletter ved naeste sweep");
});

// ── R17: fejler een modtager, faar de andre ikke mailen igen ─────────

test("ved gensendelse faar kun den modtager, der fejlede, mailen", async () => {
  const { client } = makeFakeDb([
    baseRow({
      id: "b9",
      slug: "to-ejere",
      name: "To ejere",
      cardholderWarnedAt: new Date(),
      memberships: [{ user: { email: "a@butik.dk" } }, { user: { email: "b@butik.dk" } }],
    }),
  ]);
  const got: string[] = [];
  let failB = true;
  const mailer: MailArg = async ({ to }) => {
    if (to === "b@butik.dk" && failB) throw new Error("blip");
    got.push(to);
    return true;
  };
  await sweepPendingThresholdEmails(client, mailer, NOW);
  failB = false;
  await sweepPendingThresholdEmails(client, mailer, NOW);
  await sweepPendingThresholdEmails(client, mailer, NOW);
  assert.equal(got.filter((t) => t === "a@butik.dk").length, 1, "a fik mailen een gang");
  assert.equal(got.filter((t) => t === "b@butik.dk").length, 1, "b fik den ved gensendelsen");
});

// ── Fejlscenarie 2: to samtidige krydsninger -> praecis eet varsel ──────

test("to samtidige kald giver praecis eet varsel (fire-once)", async () => {
  const { client, businesses } = makeFakeDb([
    baseRow({
      id: "b2",
      slug: "vinbar",
      name: "Vinbar",
      cardholderCount: 12,
    }),
  ]);

  // Tael faktiske afsendelser. Een omgang = 1 ejer + 1 superadmin = 2 mails.
  let sends = 0;
  const mailer: MailArg = async () => {
    sends += 1;
    return true;
  };

  // To samtidige kald (fx nyt kort + cron) mod SAMME butik i varsel-vinduet.
  await Promise.all([
    processTrialMilestones("b2", client, mailer, NOW),
    processTrialMilestones("b2", client, mailer, NOW),
  ]);

  assert.notEqual(
    businesses.get("b2")!.cardholderWarnedAt,
    null,
    "varslet blev registreret",
  );
  assert.equal(
    sends,
    2,
    `praecis EEN omgang varsler (ejer + superadmin); to omgange ville give 4, fik ${sends}`,
  );
  assert.notEqual(
    businesses.get("b2")!.cardholderWarnEmailSentAt,
    null,
    "sent-flag sat een gang",
  );
});

// ── Fuld flow: Resend-fejl PRAECIS ved varslet, saa sweep-genopretning ──
// Adskilt fra "sweep genopsamler" ovenfor: her sker fejlen under selve krydsningen
// (processTrialMilestones), ikke fra en for-udfyldt tilstand.

test("Resend-fejl ved varslet: warnedAt saettes, sentAt null, sweep gensender", async () => {
  const { client, businesses } = makeFakeDb([
    baseRow({ id: "bx", slug: "shop", name: "Shop", cardholderCount: 12 }),
  ]);

  // Varslet sker med en FEJLENDE mailer.
  const failing: MailArg = async () => {
    throw new Error("resend nede");
  };
  await processTrialMilestones("bx", client, failing, NOW);

  const b = businesses.get("bx")!;
  assert.notEqual(
    b.cardholderWarnedAt,
    null,
    "KENDSGERNING registreret: cardholderWarnedAt sat (fire-once)",
  );
  assert.equal(
    b.cardholderWarnEmailSentAt,
    null,
    "mailen fejlede -> warnEmailSentAt forbliver null",
  );

  // Sweep-cronen gensender bagefter med en virkende mailer.
  const ok: MailArg = async () => true;
  const r = await sweepPendingThresholdEmails(client, ok, NOW);
  assert.equal(r.warns, 1, "sweepet gensendte det tabte varsel");
  assert.notEqual(
    businesses.get("bx")!.cardholderWarnEmailSentAt,
    null,
    "warnEmailSentAt sat efter bekraeftet gensendelse",
  );
});

// ── Proeveperioden ───────────────────────────────────────────────────

test("foer varsel-vinduet sker der intet", async () => {
  const { client, businesses } = makeFakeDb([baseRow({ id: "n1", slug: "ny", createdAt: daysAgo(10) })]);
  let sends = 0;
  await processTrialMilestones("n1", client, async () => (sends++, true), NOW);
  assert.equal(sends, 0);
  assert.equal(businesses.get("n1")!.cardholderWarnedAt, null);
  assert.equal(businesses.get("n1")!.reached100At, null);
});

test("efter de tre maaneder: varsel og faktura-trigger, hver kun een gang", async () => {
  const { client, businesses } = makeFakeDb([baseRow({ id: "o1", slug: "gammel", createdAt: daysAgo(100) })]);
  let sends = 0;
  const mailer: MailArg = async () => (sends++, true);
  await processTrialMilestones("o1", client, mailer, NOW);
  const b = businesses.get("o1")!;
  assert.notEqual(b.cardholderWarnedAt, null, "varsel givet");
  assert.notEqual(b.reached100At, null, "fakturering startet");
  assert.notEqual(b.reached100EmailSentAt, null, "faktura-trigger leveret");
  assert.equal(sends, 3, "ejer + superadmin (varsel) + superadmin (faktura)");
  await processTrialMilestones("o1", client, mailer, NOW);
  assert.equal(sends, 3, "intet sendes igen");
});

test("sweep finder butikker, hvis milepael er naaet", async () => {
  const { client, businesses } = makeFakeDb([
    baseRow({ id: "s1", slug: "klar", createdAt: daysAgo(80) }),
    baseRow({ id: "s2", slug: "for-ny", createdAt: daysAgo(5) }),
  ]);
  const r = await sweepPendingThresholdEmails(client, async () => true, NOW);
  assert.notEqual(businesses.get("s1")!.cardholderWarnedAt, null, "varslet for den, der er i vinduet");
  assert.equal(businesses.get("s2")!.cardholderWarnedAt, null, "ingen varsel for en ny butik");
  assert.equal(r.warns, 0, "varslet blev leveret med det samme, intet tilbage at gensende");
});

import { trialEndsAt, TRIAL_COUNT_FROM } from "../src/lib/plans";

test("taelleren starter tidligst 1. december 2026", () => {
  const old = new Date("2026-07-01T10:00:00Z");
  const fresh = new Date("2027-01-15T10:00:00Z");
  const end = trialEndsAt(old);
  assert.equal(end.getTime() > TRIAL_COUNT_FROM.getTime(), true);
  assert.equal(end.toISOString().slice(0, 10), "2027-02-28", "tre maaneder fra 1. december (dansk midnat)");
  assert.equal(trialEndsAt(fresh).toISOString().slice(0, 10), "2027-04-15", "nye butikker: fra oprettelsen");
});

test("foer relanceringen sendes ingen mails, heller ikke til gamle butikker", async () => {
  const today = new Date("2026-10-30T12:00:00Z");
  const { client, businesses } = makeFakeDb([baseRow({ id: "g1", slug: "sommer", createdAt: new Date("2026-07-01T10:00:00Z") })]);
  let sends = 0;
  const r = await sweepPendingThresholdEmails(client, async () => (sends++, true), today);
  assert.equal(sends, 0);
  assert.equal(r.warns + r.invoices, 0);
  assert.equal(businesses.get("g1")!.cardholderWarnedAt, null);
  assert.equal(businesses.get("g1")!.reached100At, null);
});
