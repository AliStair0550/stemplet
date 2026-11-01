import type { Metadata } from "next";
import { loadInvite } from "./load";
import { Forward } from "./Forward";
import { safeDecode } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Delingslinket fra "Henvis en ven": egen titel og billede, der viser gaven til
// vennen, og sender saa videre til butikkens side med koden (?k=).

type Params = Promise<{ slug: string; code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, code } = await params;
  const invite = await loadInvite(slug, safeDecode(code));
  if (!invite) return { title: "Folka Kort", robots: { index: false } };
  const who = invite.friend ?? "Din ven";
  const title = invite.gift ? `${who} har givet dig ${invite.gift} hos ${invite.shop}` : `${who} inviterer dig til ${invite.shop}`;
  const description = "Hent kortet i Apple Wallet, så ligger rabatten klar til dit første besøg. Ingen app.";
  return {
    title: { absolute: title },
    description,
    robots: { index: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function InvitePage({ params }: { params: Params }) {
  const { slug, code } = await params;
  const href = `/k/${encodeURIComponent(slug)}?k=${encodeURIComponent(safeDecode(code))}`;
  const invite = await loadInvite(slug, safeDecode(code));
  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 text-center"
      style={{ background: invite?.primaryColor ?? "#061C3D", color: invite?.textColor ?? "#EAF1FB" }}
    >
      <Forward href={href} />
      <a href={href} className="text-[1rem] underline underline-offset-4">
        {invite?.gift ? `Hent din gave hos ${invite.shop}` : "Fortsæt"}
      </a>
    </main>
  );
}
