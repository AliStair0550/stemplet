import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { SubmitButton } from "@/components/SubmitButton";
import { enableStampsAction } from "../actions";

export const metadata: Metadata = { title: "Tilføj stempler" };
export const dynamic = "force-dynamic";

// "+ Stemplet" for en butik med kun Henvisninger: hvad Stemplet er, og eet tryk
// for at slaa det til. Har butikken allerede Stemplet, gaar vi bare til overblikket.

const POINTS = [
  { title: "Stempler i Apple Wallet", text: "Kunden scanner din QR-kode og har kortet på få sekunder. Ingen app." },
  { title: "Flere gensyn", text: "Et stempel pr. besøg og en belønning, når kortet er fuldt." },
  { title: "Samme kort som Henvisninger", text: "Stempler og henvisningskode står på det samme kort i kundens Wallet." },
];

export default async function AddStampsPage() {
  const { business } = await requireBusiness();
  if (business.stampsEnabled) redirect("/app/stemplet");

  return (
    <div className="mx-auto max-w-[560px] py-4">
      <p className="text-[1.6rem] font-semibold leading-none tracking-[-0.03em] text-ink">Stempler</p>
      <h1 className="mt-6 text-[1.9rem] font-[500] leading-tight tracking-[-0.015em] text-ink">
        Få dine kunder til at komme igen.
      </h1>
      <p className="mt-2 text-[0.98rem] text-stone">
        Stempler giver kunden et stempel pr. besøg og en belønning, når kortet er fuldt. Det passer perfekt til henvisninger: nye kunder kommer via en ven, og
        stemplerne får dem til at komme igen.
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        {POINTS.map((p) => (
          <li key={p.title} className="rounded-xl border border-fog bg-white px-5 py-4 shadow-card">
            <p className="text-[0.95rem] font-[600] text-ink">{p.title}</p>
            <p className="mt-0.5 text-[0.88rem] text-stone">{p.text}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[0.88rem] text-stone">Samme pris. Stemplet er med, uden tillæg.</p>
      <form action={enableStampsAction} className="mt-5">
        <SubmitButton size="lg" pendingText="Slår til">
          Slå Stemplet til
        </SubmitButton>
      </form>
    </div>
  );
}
