import "server-only";

// Sender en mail via Resend REST. Uden noegle (lokal udvikling) springes der
// bare over, saa intet vaelter.
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.EMAIL_FROM || "Stemplet <login@alius.dk>";
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
