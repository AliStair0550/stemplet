import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(inner: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Afmeld</title></head>
     <body style="margin:0;background:#FAF8F4;font-family:Arial,Helvetica,sans-serif;">
       <div style="max-width:440px;margin:80px auto;padding:0 24px;text-align:center;">
         <div style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#1A1A1A;">Stemplet<span style="color:#2D5F4A;">.</span></div>
         <div style="margin-top:28px;line-height:1.6;">${inner}</div>
       </div>
     </body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

// GET viser en BEKRAEFT-side UDEN bivirkning. Mail-scannere og link-prefetch
// (Outlook SafeLinks m.fl.) rammer GET og maa ikke kunne afmelde nogen. Selve
// afmeldingen sker foerst ved POST, naar et menneske klikker "Bekraeft".
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  try {
    await verifyUnsubscribeToken(token);
  } catch {
    return page(
      `<h1 style="font-weight:400;color:#1A1A1A;">Linket virker ikke</h1>
       <p style="color:#4A4A4A;">Prøv linket i den seneste mail, eller slå ugebrevet fra under Indstillinger i dit dashboard.</p>`,
      400,
    );
  }

  return page(
    `<h1 style="font-weight:400;color:#1A1A1A;">Afmeld ugebrevet?</h1>
     <p style="color:#4A4A4A;">Du får ikke flere ugentlige statistik-mails. Du kan altid slå dem til igen under Indstillinger i dit dashboard.</p>
     <form method="post" action="/api/email/unsubscribe" style="margin-top:24px;">
       <input type="hidden" name="token" value="${escapeAttr(token)}">
       <button type="submit" style="display:inline-block;padding:12px 28px;background:#2D5F4A;color:#FAF8F4;border:none;border-radius:9999px;font-size:14px;letter-spacing:0.04em;cursor:pointer;">Bekræft afmelding</button>
     </form>`,
  );
}

// POST udfoerer den egentlige afmelding (kun ved bevidst klik).
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  let ok = true;
  try {
    const businessId = await verifyUnsubscribeToken(token);
    await prisma.business.update({
      where: { id: businessId },
      data: { weeklyEmailEnabled: false },
    });
  } catch {
    ok = false;
  }

  return page(
    ok
      ? `<h1 style="font-weight:400;color:#1A1A1A;">Du er afmeldt</h1>
         <p style="color:#4A4A4A;">Du får ikke flere ugebreve. Du kan altid slå dem til igen under Indstillinger i dit dashboard.</p>`
      : `<h1 style="font-weight:400;color:#1A1A1A;">Linket virker ikke</h1>
         <p style="color:#4A4A4A;">Prøv linket i den seneste mail, eller slå ugebrevet fra under Indstillinger i dit dashboard.</p>`,
    ok ? 200 : 400,
  );
}
