import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ét-kliks afmelding af ugebrevet fra mailen. Gemmer preferencen paa Business.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
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

  const body = ok
    ? `<h1 style="font-weight:400;color:#1A1A1A;">Du er afmeldt</h1>
       <p style="color:#4A4A4A;">Du får ikke flere ugebreve. Du kan altid slå dem til igen under Indstillinger i dit dashboard.</p>`
    : `<h1 style="font-weight:400;color:#1A1A1A;">Linket virker ikke</h1>
       <p style="color:#4A4A4A;">Prøv linket i den seneste mail, eller slå ugebrevet fra under Indstillinger i dit dashboard.</p>`;

  return new Response(
    `<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Afmeld</title></head>
     <body style="margin:0;background:#FAF8F4;font-family:Arial,Helvetica,sans-serif;">
       <div style="max-width:440px;margin:80px auto;padding:0 24px;text-align:center;">
         <div style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#1A1A1A;">Stemplet<span style="color:#2D5F4A;">.</span></div>
         <div style="margin-top:28px;line-height:1.6;">${body}</div>
       </div>
     </body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
