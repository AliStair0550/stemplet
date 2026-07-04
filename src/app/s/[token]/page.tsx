import { verifyStampToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { StampConfirm } from "./StampConfirm";
import { ButtonLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StampPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let slug = "";
  let name = "";
  let valid = true;
  try {
    const payload = await verifyStampToken(token);
    const business = await prisma.business.findUnique({
      where: { id: payload.businessId },
      select: { slug: true, name: true },
    });
    if (!business) valid = false;
    else {
      slug = business.slug;
      name = business.name;
    }
  } catch {
    valid = false;
  }

  if (!valid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-parchment px-6 text-center">
        <h1 className="font-[300] text-[1.4rem] text-ink">Koden er udloebet</h1>
        <p className="max-w-xs font-[200] text-[0.9rem] leading-relaxed text-stone">
          Stempel-koder er kun gyldige et minut ad gangen. Bed personalet om at
          vise en ny.
        </p>
      </main>
    );
  }

  return <StampConfirm token={token} slug={slug} businessName={name} />;
}
