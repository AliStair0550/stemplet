"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cancellationLastDay } from "@/lib/billing";
import { trialEndsAt } from "@/lib/plans";
import { superadminCancellationEmail } from "@/lib/emails";
import { sendEmail } from "@/lib/send-email";
import { superadminRecipients } from "@/lib/superadmin-emails";
import { PLATFORM } from "@/lib/platform";
import { APP_URL } from "@/lib/env";
import { formatDkDate } from "@/lib/utils";
import { captureServerError } from "@/lib/sentry";

/** Ejeren bekraefter abonnementet. Logges med tidspunkt + bruger. Idempotent:
 *  kun den FOERSTE godkendelse taeller (senere klik aendrer ikke tidsstemplet). */
export async function approveProAgreement(): Promise<{ ok: boolean }> {
  const { business, userId } = await requireBusiness();
  await prisma.business.updateMany({
    where: { id: business.id, proApprovedAt: null },
    data: { proApprovedAt: new Date(), proApprovedById: userId },
  });
  revalidatePath("/app/aftale");
  revalidatePath("/app");
  return { ok: true };
}

/** Ejeren opsiger (eller fortryder). Ingen binding: kortet koerer til sidste
 *  dag, og Ali faar en mail, saa lukningen og fakturaen haandteres. */
export async function setCancelled(cancel: boolean): Promise<{ ok: boolean }> {
  const { business, userId } = await requireBusiness();
  const res = await prisma.business.updateMany({
    where: { id: business.id, cancelledAt: cancel ? null : { not: null } },
    data: { cancelledAt: cancel ? new Date() : null },
  });
  // Kun en mail, naar tilstanden faktisk skiftede (ikke ved dobbelttryk).
  if (res.count > 0) {
    try {
      const [biz, user] = await Promise.all([
        prisma.business.findUnique({ where: { id: business.id }, select: { name: true, createdAt: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
      ]);
      const mail = superadminCancellationEmail({
        shop: biz?.name ?? business.name,
        email: user?.email ?? "(ukendt)",
        cancelled: cancel,
        lastDay: formatDkDate(cancellationLastDay(trialEndsAt(biz?.createdAt ?? new Date()), new Date())),
        adminUrl: `${APP_URL}/admin`,
      });
      const to = superadminRecipients();
      await sendEmail({ to: (to.length > 0 ? to : [PLATFORM.contactEmail]).join(","), subject: mail.subject, html: mail.html, text: mail.text });
    } catch (e) {
      // Ali skal vide det: en tabt opsigelses-mail ses i Sentry.
      captureServerError(e, { route: "aftale/opsig", businessId: business.id });
    }
  }
  revalidatePath("/app/aftale");
  return { ok: true };
}
