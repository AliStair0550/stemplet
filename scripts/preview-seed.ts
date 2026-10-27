// Seed til testversionen af Henvisninger (preview med EGEN database). Koeres af
// scripts/vercel-build.sh KUN naar PREVIEW_DATABASE=1 er sat for branchen, og
// rammer derfor aldrig produktionsdatabasen. Idempotent: kan koere ved hvert build.
//
// Opretter en testsalon med Henvisninger slaaet til og en ejer med e-mailen i
// PREVIEW_OWNER_EMAIL, saa man kan logge ind med et almindeligt login-link.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "sara-salon-test";

/**
 * Vagt FOER migrationen. En testdatabase er enten helt tom, eller den indeholder
 * testbutikken (som seed'et har lagt der). En database med butikker men UDEN
 * testbutikken ligner produktion: saa stopper vi buildet, foer der migreres.
 */
async function guard() {
  let total = 0;
  let hasTest = false;
  try {
    total = await prisma.business.count();
    hasTest = (await prisma.business.count({ where: { slug: SLUG } })) > 0;
  } catch {
    // Tom database uden tabeller endnu: helt i orden.
    return;
  }
  if (total > 0 && !hasTest) {
    console.error(
      `preview-seed: databasen har ${total} butikker, men ikke testbutikken. Det ligner ikke en testdatabase. Stopper.`,
    );
    process.exit(1);
  }
  console.log("preview-seed: vagt ok (testdatabase).");
}

async function main() {
  if (process.argv.includes("--guard")) return guard();
  const email = process.env.PREVIEW_OWNER_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log("preview-seed: PREVIEW_OWNER_EMAIL er ikke sat, springer over.");
    return;
  }

  const business = await prisma.business.upsert({
    where: { slug: SLUG },
    update: {},
    create: {
      name: "Sara Salon (test)",
      slug: SLUG,
      referralsEnabled: true,
      bookingUrl: "https://www.planway.com",
      termsAcceptedAt: new Date(),
      cards: { create: { rewardText: "Gratis klip", stampIcon: "scissors" } },
      referralRule: {
        create: {
          newCustomerRewardType: "AMOUNT",
          newCustomerRewardValue: "100",
          referrerRewardType: "AMOUNT",
          referrerRewardValue: "100",
          minPurchaseKr: 300,
          maxReferralsPerMonth: 5,
          termsLine: "Gælder ved første besøg over 300 kr.",
        },
      },
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Test", businessId: business.id },
  });
  await prisma.membership.upsert({
    where: { userId_businessId: { userId: user.id, businessId: business.id } },
    update: {},
    create: { userId: user.id, businessId: business.id },
  });
  console.log(`preview-seed: klar (${SLUG}, ejer ${email}).`);
}

main()
  .catch((e) => {
    console.error("preview-seed fejlede", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
