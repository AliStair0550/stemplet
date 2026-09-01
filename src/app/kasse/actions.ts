"use server";

import { redirect } from "next/navigation";
import { clearKasseCookie, kasseAccess, revokeDevice } from "@/lib/kasse";

// Selve parringen er flyttet til en top-niveau form-POST (/kasse/par), saa
// kasse-cookien gemmes paalideligt paa iOS (server-action-fetch fik Safari til at
// droppe Set-Cookie). Se src/app/kasse/par/route.ts.

export async function unpairAction(): Promise<void> {
  // Frakobl paa selve enheden: revokér ogsaa Device-raekken server-side, saa den
  // ikke bliver ved med at staa som "aktiv" i ejerens liste (og 2-aars-tokenet
  // ikke fortsat er gyldigt), foer cookien ryddes.
  const access = await kasseAccess();
  if (access?.source === "device" && access.deviceId) {
    await revokeDevice(access.businessId, access.deviceId);
  }
  await clearKasseCookie();
  redirect("/kasse");
}
