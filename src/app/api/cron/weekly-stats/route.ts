import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWeeklyStats } from "@/lib/stats";
import { weeklyStatsEmail } from "@/lib/emails";
import { sendEmail } from "@/lib/send-email";
import { signUnsubscribeToken } from "@/lib/tokens";
import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Ugentlig statistik-mail. Kaldes af Vercel cron (mandag) og er beskyttet med
// CRON_SECRET: Vercel sender "Authorization: Bearer <CRON_SECRET>", hvis env-
// varen er sat.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Kun mandag. Robust mod Hobby-plan, der kan trigge cron dagligt. ?force=1
  // (stadig bag CRON_SECRET) springer tjekket over ved manuel test.
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!force && new Date().getUTCDay() !== 1) {
    return Response.json({ skipped: "koerer kun mandag" });
  }

  const d30 = new Date();
  d30.setDate(d30.getDate() - 30);

  // Aktive virksomheder: mindst ét stempel de seneste 30 dage OG ugebrev til.
  const businesses = await prisma.business.findMany({
    where: {
      weeklyEmailEnabled: true,
      cards: {
        some: {
          customerCards: {
            some: { stampsLog: { some: { createdAt: { gte: d30 } } } },
          },
        },
      },
    },
    select: { id: true, name: true, users: { select: { email: true } } },
  });

  // Per-butik-arbejde med begraenset samtidighed (chunks paa 5) i stedet for en
  // fuldt sekventiel loop, saa cron'en holder sig godt under maxDuration selv
  // naar kundebasen vokser. Hver butik returnerer antal sendte mails.
  async function processBusiness(b: (typeof businesses)[number]): Promise<number> {
    try {
      const stats = await getWeeklyStats(b.id);
      const token = await signUnsubscribeToken(b.id);
      const mail = weeklyStatsEmail({
        businessName: b.name,
        ...stats,
        dashboardUrl: `${APP_URL}/app`,
        unsubscribeUrl: `${APP_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`,
      });
      let count = 0;
      for (const u of b.users) {
        if (!u.email) continue;
        const ok = await sendEmail({
          to: u.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
        if (ok) count += 1;
      }
      return count;
    } catch (e) {
      console.error("Ugebrev fejlede for", b.id, e);
      return 0;
    }
  }

  let sent = 0;
  const CONCURRENCY = 5;
  for (let i = 0; i < businesses.length; i += CONCURRENCY) {
    const chunk = businesses.slice(i, i + CONCURRENCY);
    const counts = await Promise.all(chunk.map(processBusiness));
    sent += counts.reduce((a, c) => a + c, 0);
  }

  return Response.json({ businesses: businesses.length, sent });
}
