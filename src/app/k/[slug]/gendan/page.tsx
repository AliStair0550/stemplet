import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardTitle, rgba } from "@/lib/brand";
import { recoveryTokenValid } from "@/lib/card-recovery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Gendan dit kort" }, robots: { index: false } };

// Siden, linket i gendannelses-mailen aabner. Selve gendannelsen sker foerst,
// naar kunden trykker paa knappen (POST), saa mail-programmers link-scannere
// ikke bruger linket op.
export default async function RecoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string | string[]; udloebet?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  // ?t= to gange giver en liste; brug kun en ren tekst.
  const t = typeof sp.t === "string" ? sp.t : "";
  const udloebet = sp.udloebet;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, displayName: true, primaryColor: true, textColor: true, stampsEnabled: true },
  });
  if (!business) notFound();

  const valid = !udloebet && (await recoveryTokenValid(t, slug));
  const fg = business.textColor;
  const shop = cardTitle(business);
  const backHref = `/k/${slug}`;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: business.primaryColor, color: fg }}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <h1 className="text-[1.5rem] font-[400] leading-tight">
          {valid ? `Gendan dit kort hos ${shop}` : "Linket virker ikke længere"}
        </h1>
        <p className="text-[0.92rem] font-[300] leading-relaxed" style={{ color: rgba(fg, 0.75) }}>
          {valid
            ? "Tryk på knappen på den telefon, hvor du vil have dit kort. Dine stempler og belønninger følger med."
            : "Linket er udløbet eller allerede brugt. Bed om et nyt link på butikkens side."}
        </p>
        {valid ? (
          <form method="POST" action={`/api/wallet/claim/${slug}/gendan/indloes`} className="w-full">
            <input type="hidden" name="t" value={t} />
            <button
              type="submit"
              className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl px-8 py-3.5 text-[0.95rem] font-medium shadow-lift transition-transform active:scale-[0.98]"
              style={{ backgroundColor: fg, color: business.primaryColor }}
            >
              Gendan mit kort
            </button>
          </form>
        ) : (
          <Link
            href={backHref}
            className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl px-8 py-3.5 text-[0.95rem] font-medium"
            style={{ backgroundColor: fg, color: business.primaryColor }}
          >
            Til {shop}
          </Link>
        )}
      </div>
    </main>
  );
}
