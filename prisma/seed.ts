// Seed: en demo-virksomhed med liv i data, saa dashboard og statistik
// ikke er tomme fra start. Koeres med `npm run db:seed`.
import { PrismaClient, StampMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function serial(len = 10) {
  const b = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}
function token() {
  return randomBytes(24).toString("hex");
}
function daysAgo(n: number, jitterHours = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
  if (jitterHours) d.setHours(d.getHours() - jitterHours);
  return d;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Rydder demo-data...");
  const existing = await prisma.business.findUnique({
    where: { slug: "demo-kaffebar" },
  });
  if (existing) {
    await prisma.business.delete({ where: { id: existing.id } });
  }

  console.log("Opretter Demo Kaffebar...");
  const staffPin = await bcrypt.hash("1234", 10);
  const business = await prisma.business.create({
    data: {
      name: "Demo Kaffebar",
      slug: "demo-kaffebar",
      primaryColor: "#1F3A2E",
      textColor: "#FFFFFF",
      plan: "FREE",
      staffPin,
      stampCooldownMin: 120,
      users: {
        create: { email: "demo@stemplet.dk", name: "Demo Kaffebar" },
      },
      cards: {
        create: {
          stampsRequired: 10,
          rewardText: "10. kop er gratis",
          stampIcon: "coffee",
          active: true,
        },
      },
    },
    include: { cards: true },
  });
  const card = business.cards[0];

  console.log("Opretter kundekort med stempler...");
  const firstNames = [
    "Emma", "Frederik", "Ida", "Oscar", "Clara", "William",
    "Alma", "Noah", "Ella", "Aksel", "Sofia", "Malthe",
    "Freja", "Victor", "Anna", "Lucas", "Karla", "Elias",
  ];

  let totalStamps = 0;
  let totalRedemptions = 0;

  for (let i = 0; i < firstNames.length; i++) {
    const created = daysAgo(Math.floor(Math.random() * 40));
    const cc = await prisma.customerCard.create({
      data: {
        cardId: card.id,
        serial: serial(),
        authToken: token(),
        contactEmail: Math.random() > 0.5 ? `${firstNames[i].toLowerCase()}@eksempel.dk` : null,
        createdAt: created,
      },
    });

    // Antal besoeg (stempler) for denne kunde
    const visits = 1 + Math.floor(Math.random() * 16);
    let stamps = 0;
    let completed = 0;
    let last: Date | null = null;

    for (let v = 0; v < visits; v++) {
      const when = daysAgo(Math.floor(Math.random() * 30));
      await prisma.stamp.create({
        data: {
          customerCardId: cc.id,
          method: pick([StampMethod.KIOSK_QR, StampMethod.STAFF_SCAN]),
          multiplier: 1,
          createdAt: when,
        },
      });
      totalStamps++;
      stamps++;
      if (last === null || when > last) last = when;
      if (stamps >= card.stampsRequired) {
        // fuldt kort -> indloest
        await prisma.redemption.create({
          data: { customerCardId: cc.id, createdAt: when },
        });
        totalRedemptions++;
        completed++;
        stamps = 0;
      }
    }

    await prisma.customerCard.update({
      where: { id: cc.id },
      data: { stamps, completedCount: completed, lastStampAt: last },
    });
  }

  // En aktiv dobbeltstempel-kampagne, saa kampagnesiden har indhold
  await prisma.campaign.create({
    data: {
      cardId: card.id,
      type: "DOUBLE_STAMP",
      startsAt: daysAgo(2),
      endsAt: daysAgo(-5),
    },
  });

  console.log(
    `Faerdig. ${firstNames.length} kunder, ${totalStamps} stempler, ${totalRedemptions} indloesninger.`,
  );
  console.log("Login-e-mail: demo@stemplet.dk  |  Personale-PIN: 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
