import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardTitle, rgba } from "@/lib/brand";
import { verifyNewsOptOutToken } from "@/lib/news-optout";
import { OptOutToggle } from "./OptOutToggle";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Pushbeskeder" }, robots: { index: false } };

// Siden, linket paa kortets bagside aabner. Selve skiftet sker foerst, naar
// kunden trykker paa knappen, saa et link, der bare bliver aabnet, intet aendrer.
export default async function NewsOptOutPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const serial = verifyNewsOptOutToken(decodeURIComponent(token));
  if (!serial) notFound();
  const cc = await prisma.customerCard.findUnique({
    where: { serial },
    select: {
      newsOptOut: true,
      card: { select: { business: { select: { name: true, displayName: true, slug: true, primaryColor: true, textColor: true } } } },
    },
  });
  if (!cc) notFound();
  const b = cc.card.business;
  const fg = b.textColor;
  const shop = cardTitle(b);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: b.primaryColor, color: fg }}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <h1 className="text-[1.5rem] font-[400] leading-tight">Pushbeskeder fra {shop}</h1>
        <OptOutToggle token={decodeURIComponent(token)} optedOut={cc.newsOptOut} shop={shop} fg={fg} bg={b.primaryColor} />
        <p className="text-[0.82rem] font-[300] leading-relaxed" style={{ color: rgba(fg, 0.7) }}>
          Dit kort, dine stempler og belønninger virker som før, uanset hvad du vælger.
        </p>
        <Link href={`/k/${b.slug}`} className="text-[0.85rem] underline underline-offset-4" style={{ color: rgba(fg, 0.8) }}>
          Til {shop}
        </Link>
      </div>
    </main>
  );
}
