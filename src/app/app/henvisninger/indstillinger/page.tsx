import { redirect } from "next/navigation";

// Henvisningernes regler bor nu paa den faelles Regler-side (Dit kort > Regler).
// Adressen beholdes, saa gamle links og bogmaerker stadig virker.
export default function IndstillingerRedirect() {
  redirect("/app/regler?f=henvisninger");
}
