import { redirect } from "next/navigation";

// Den gamle opsaetningsguide er afloest af "Kom i gang" paa Hjem.
export default function KomIGangPage() {
  redirect("/app");
}
