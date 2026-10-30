import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { PageHeading } from "@/components/dash";
import { cardShortName, claimCta } from "@/lib/card-name";
import { createHash } from "node:crypto";
import { parsePosterSettings } from "@/lib/materials";
import { PosterBuilder } from "./PosterBuilder";

export const metadata: Metadata = { title: "Plakat" };
export const dynamic = "force-dynamic";

// Plakat: tryk-klare skilte i butikkens kortdesign (farver, logo, eget billede).
// Fokus er enten at hente kortet eller at henvise en ven. Selve PDF'en laves af
// /api/materials/[type]; siden er valgene og en live-visning af den rigtige PDF.
export default async function PlakatPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeading
        title="Plakat"
        subtitle="Skilte til disken, døren og vinduet, i dit kortdesign. Hent en tryk-klar PDF."
      />
      <PosterBuilder
        stampsEnabled={business.stampsEnabled}
        referralsEnabled={business.referralsEnabled}
        photo={business.posterPhoto ?? business.cardArtwork}
        ownPhoto={!!business.posterPhoto}
        designPhoto={!!business.cardArtwork}
        photoVersion={createHash("sha1").update(business.posterPhoto ?? business.cardArtwork ?? "").digest("hex").slice(0, 8)}
        saved={business.posterSettings ? parsePosterSettings(business.posterSettings) : null}
        cardHeadline={claimCta(cardShortName(business))}
      />
    </>
  );
}
