import "server-only";

// Sender en mail via Resend REST. Uden noegle (lokal udvikling) springes der
// bare over, saa intet vaelter.
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Afsendernavn (fx butikkens navn); adressen er altid EMAIL_FROM's. */
  fromName?: string;
}): Promise<boolean> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const base = process.env.EMAIL_FROM || "Stemplet <login@alius.dk>";
  const addr = /<([^>]+)>/.exec(base)?.[1] ?? base.trim();
  // Navnet renses for tegn, der kan bryde "Navn <adresse>"-formatet.
  const from = input.fromName ? `${input.fromName.replace(/[<>"\r\n]/g, "").trim()} <${addr}>` : base;
  if (!apiKey) {
    console.log(`[email] Resend ikke konfigureret, springer over: ${input.subject} -> ${input.to}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend-fejl (${res.status}): ${detail}`);
  }
  return true;
}
