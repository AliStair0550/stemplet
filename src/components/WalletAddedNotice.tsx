"use client";

import { CheckBurst, Confetti } from "@/components/Celebrate";

// Kvittering: kortet er nu i Apple Wallet. Delt mellem claim-siden
// (/k/[slug], iPhone-flowet) og webkortet (/kort/[serial]), saa teksten og stilen
// kun findes eet sted. I butikkens farver; konfetti kun naar vi ved, at kortet
// faktisk er landet (claim-siden bekraefter via registreringen).
export function WalletAddedNotice({
  bg = "#061C3D",
  fg = "#FFFFFF",
  celebrate = false,
}: {
  bg?: string;
  fg?: string;
  celebrate?: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-card">
      {celebrate ? <Confetti colors={[bg, fg === "#FFFFFF" ? "#7CC4FF" : fg, "#C8D8E8", "#1B5EAE"]} /> : null}
      <CheckBurst size={56} bg={bg} fg={fg} />
      <p className="text-[1.15rem] font-semibold leading-tight text-[#061C3D]">Kortet er i din Wallet</p>
      <p className="max-w-[18rem] text-[0.92rem] leading-snug text-[#5F6B7E]">Vis QR-koden ved kassen, så får du stempler.</p>
    </div>
  );
}
