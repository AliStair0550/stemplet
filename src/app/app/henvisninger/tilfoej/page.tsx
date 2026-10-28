import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { SubmitButton } from "@/components/SubmitButton";
import { Scribble } from "@/components/henvisninger-site/Hand";
import { enableReferralsAction } from "../actions";

export const metadata: Metadata = { title: "Tilføj Henvisninger" };
export const dynamic = "force-dynamic";

// "+ Henvisninger" for en butik med kun Stemplet: hvad Henvisninger er, og eet
// tryk for at slaa det til. Har butikken det allerede, gaar vi til overblikket.

const POINTS = [
  { title: "Kunderne henviser deres venner", text: "Hver kunde får sit eget link. Vennen får rabat ved første besøg." },
  { title: "Du bestemmer belønningen", text: "Fx 100 kr. til vennen og et gratis klip til kunden, når vennen har været der." },
  { title: "Samme kort som Stemplet", text: "Henvisningskoden står på det samme kort i kundens Wallet." },
];

export default async function AddReferralsPage() {
  const { business } = await requireBusiness();
  if (business.referralsEnabled) redirect("/app/henvisninger");

  return (
    <div className="mx-auto max-w-[560px] py-4">
      <span className="relative inline-block pb-[0.9rem] text-ink">
        <HenvisningerLogo className="h-[2.6rem]" />
        <Scribble className="absolute bottom-0 left-[14%] h-[1rem] w-[90%]" />
      </span>
      <h1 className="mt-6 text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-ink">
        Få nye kunder via dine kunder.
      </h1>
      <p className="mt-2 text-[0.98rem] text-stone">
        Henvisninger passer perfekt til Stemplet: nye kunder kommer via en ven, og stempelkortet får dem til at komme
        igen.
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        {POINTS.map((p) => (
          <li key={p.title} className="rounded-xl border border-fog bg-white px-5 py-4 shadow-card">
            <p className="text-[0.95rem] font-[600] text-ink">{p.title}</p>
            <p className="mt-0.5 text-[0.88rem] text-stone">{p.text}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[0.88rem] text-stone">Samme pris. Henvisninger er med, uden tillæg.</p>
      <form action={enableReferralsAction} className="mt-5">
        <SubmitButton size="lg" pendingText="Slår til">
          Slå Henvisninger til
        </SubmitButton>
      </form>
    </div>
  );
}
