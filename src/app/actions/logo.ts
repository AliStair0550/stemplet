"use server";

import { auth } from "@/lib/auth";
import { uploadLogoFile } from "@/lib/uploadthing";

export async function uploadLogoAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.businessId) return { error: "Ikke logget ind." };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vaelg en billedfil." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { error: "Filen maa hoejst vaere 4 MB." };
  }

  try {
    const url = await uploadLogoFile(file);
    return { url };
  } catch {
    return { error: "Upload fejlede. Proev igen." };
  }
}
