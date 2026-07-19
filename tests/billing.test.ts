import { test } from "node:test";
import assert from "node:assert/strict";

// Superadmin-modtager, saa taerskel-mails har nogen at gaa til. Laeses FOERST naar
// superadminRecipients() kaldes (runtime), saa det er nok at saette den her.
process.env.SUPERADMIN_EMAIL = "admin@stemplet.dk";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://u:p@localhost:5432/db";

import {
  processCardholderThresholds,
  sweepPendingThresholdEmails,
} from "../src/lib/billing";

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
  cardholderWarnedAt: Date | null;
  cardholderWarnEmailSentAt: Date | null;
  reached100At: Date | null;
  reached100EmailSentAt: Date | null;
  proApprovedAt: Date | null;
  proPriceKr: number;
  proPriceUntil: Date | null;
  users: { email: string | null }[];
  cards: { id: string }[];
};

function matchWhere(row: Record<string, unknown>, where: Record<string, unknown>) {
  for (const [k, v] of Object.entries(where)) {
    const cur = row[k];
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

  const client = {
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
    cardholderWarnedAt: null,
    cardholderWarnEmailSentAt: null,
    reached100At: null,
    reached100EmailSentAt: null,
    proApprovedAt: null,
    proPriceKr: 99,
    proPriceUntil: null,
    users: [{ email: "ejer@butik.dk" }],
    cardholderCount: 0,
    ...over,
  };
}

// ── Fejlscenarie 1: mail fejler ved krydsning -> sweepet samler varslet op ──

test("sweep genopsamler 80-varslet efter et mail-blip", async () => {
  // Butik HAR krydset 80 (Warned sat), men mailen fejlede (EmailSent stadig null).
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
  const r1 = await sweepPendingThresholdEmails(client, failing);
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
  const r2 = await sweepPendingThresholdEmails(client, ok);
  assert.equal(r2.warns, 1, "varslet blev genopsamlet og leveret");
  assert.ok(delivered >= 1, "mailen blev sendt ved retry");
  assert.notEqual(
    businesses.get("b1")!.cardholderWarnEmailSentAt,
    null,
    "sent-flag sat efter bekraeftet levering",
  );

  // Tredje sweep: intet tilbage at gensende (idempotent, ingen dubletter).
  const r3 = await sweepPendingThresholdEmails(client, ok);
  assert.equal(r3.warns, 0, "ingen dubletter ved naeste sweep");
});

// ── Fejlscenarie 2: to samtidige krydsninger -> praecis eet varsel ──────

test("to samtidige krydsninger af 80 giver praecis eet varsel (fire-once)", async () => {
  const { client, businesses } = makeFakeDb([
    baseRow({
      id: "b2",
      slug: "vinbar",
      name: "Vinbar",
      cardholderCount: 80, // netop krydset 80 (ikke 100)
    }),
  ]);

  // Tael faktiske afsendelser. Een omgang = 1 ejer + 1 superadmin = 2 mails.
  let sends = 0;
  const mailer: MailArg = async () => {
    sends += 1;
    return true;
  };

  // To samtidige "det 80. kort blev lige oprettet"-kald mod SAMME butik.
  await Promise.all([
    processCardholderThresholds("b2", client, mailer),
    processCardholderThresholds("b2", client, mailer),
  ]);

  assert.notEqual(
    businesses.get("b2")!.cardholderWarnedAt,
    null,
    "taersklen blev registreret",
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

// ── Fuld flow: Resend-fejl PRAECIS ved 80-krydsningen, saa sweep-genopretning ──
// Adskilt fra "sweep genopsamler" ovenfor: her sker fejlen under selve krydsningen
// (processCardholderThresholds), ikke fra en for-udfyldt tilstand.

test("Resend-fejl ved 80-krydsning: warnedAt saettes, sentAt null, sweep gensender", async () => {
  const { client, businesses } = makeFakeDb([
    baseRow({ id: "bx", slug: "shop", name: "Shop", cardholderCount: 80 }),
  ]);

  // Krydsningen sker med en FEJLENDE mailer.
  const failing: MailArg = async () => {
    throw new Error("resend nede");
  };
  await processCardholderThresholds("bx", client, failing);

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
  const r = await sweepPendingThresholdEmails(client, ok);
  assert.equal(r.warns, 1, "sweepet gensendte det tabte varsel");
  assert.notEqual(
    businesses.get("bx")!.cardholderWarnEmailSentAt,
    null,
    "warnEmailSentAt sat efter bekraeftet gensendelse",
  );
});
