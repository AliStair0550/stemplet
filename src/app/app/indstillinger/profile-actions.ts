"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness, getSupportBusiness } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { deleteUserProfile } from "@/lib/profile-delete";
import { captureServerError } from "@/lib/sentry";

/** Slet min profil (og butikker, hvor jeg er alene). Kraever, at der skrives SLET. */
export async function deleteProfileAction(confirm: string): Promise<{ ok: false; error: string }> {
  const { userId } = await requireBusiness();
  if (confirm.trim().toUpperCase() !== "SLET") return { ok: false, error: "Skriv SLET for at bekræfte." };
  if (await getSupportBusiness()) return { ok: false, error: "Afslut support, før du sletter din profil." };
  try {
    const slugs = await deleteUserProfile(userId);
    for (const slug of slugs) revalidatePath(`/k/${slug}`);
  } catch (e) {
    captureServerError(e, { route: "deleteProfileAction" });
    return { ok: false, error: "Profilen kunne ikke slettes. Prøv igen, eller skriv til os." };
  }
  await signOut({ redirectTo: "/" });
  return { ok: false, error: "" };
}
