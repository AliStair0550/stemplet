import { redirect } from "next/navigation";

// Stemplernes regler bor nu paa den faelles Regler-side (Dit kort > Regler).
// Adressen beholdes, saa gamle links og bogmaerker stadig virker.
export default function KortRedirect() {
  redirect("/app/regler?f=stempler");
}
