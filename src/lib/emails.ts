// Brandede mails i Stemplets tone og visuelle stil: professionel, enkel og
// menneskelig. Vi starter direkte, kommer hurtigt til pointen, forklarer
// vaerdien og slutter med et klart naeste skridt. Bygget med tabel-layout og
// inline styles, saa det ser ens ud i alle mail-klienter. Ingen lange
// bindestreger.

const C = {
  parchment: "#FAF8F4",
  card: "#FFFFFF",
  moss: "#2D5F4A",
  ink: "#1A1A1A",
  stone: "#4A4A4A",
  slate: "#6B7B75",
  fog: "#E8E5DF",
};

type Email = { subject: string; html: string; text: string };

function shell(preheader: string, inner: string, footerExtra = ""): string {
  return `<!doctype html>
<html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.parchment};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.parchment};">
  <tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
      <tr><td style="padding:0 4px 20px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:${C.ink};letter-spacing:.02em;">Stemplet<span style="color:${C.moss};">.</span></span>
      </td></tr>
      <tr><td style="background:${C.card};border:1px solid ${C.fog};border-radius:12px;padding:36px 32px;">
        ${inner}
      </td></tr>
      <tr><td style="padding:20px 4px 0;">
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.slate};">
          Stemplet. Stempelkortet, der skaber flere gensyn.
        </p>
        ${footerExtra}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** Login-link (magic link). Bruges baade ved log ind og efter onboarding. */
export function loginEmail(url: string): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="border-radius:8px;background:${C.moss};">
      <a href="${url}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Log ind på Stemplet</a>
    </td></tr></table>`;

  const inner = `
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      Her er dit login-link.
    </p>
    <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      Du er ét klik fra dit dashboard, hvor du følger stempler, genbesøg og indløsninger i realtid.
    </p>
    ${button}
    <p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${C.slate};">
      Klik på knappen for at komme ind. Linket virker i kort tid og kun én gang.
    </p>
    <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.slate};word-break:break-all;">
      Virker knappen ikke, så kopiér linket:<br>
      <a href="${url}" style="color:${C.moss};">${url}</a>
    </p>
    <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${C.fog};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.slate};">
      Har du ikke bedt om at logge ind, kan du roligt ignorere denne mail.
    </p>`;

  const text = [
    "Her er dit login-link.",
    "",
    "Du er ét klik fra dit dashboard, hvor du følger stempler, genbesøg og indløsninger.",
    "",
    "Log ind her (virker i kort tid og kun én gang):",
    url,
    "",
    "Har du ikke bedt om at logge ind, kan du roligt ignorere denne mail.",
    "",
    "Stemplet. Stempelkortet, der skaber flere gensyn.",
  ].join("\n");

  return {
    subject: "Dit login-link til Stemplet",
    html: shell("Log ind på dit Stemplet-dashboard.", inner),
    text,
  };
}

// ── Ugentlig statistik-mail ──────────────────────────────────────────

export type WeeklyEmailData = {
  businessName: string;
  stampsWeek: number;
  stampsDelta: number;
  newCustomers: number;
  redemptions: number;
  churn: number;
  dashboardUrl: string;
  unsubscribeUrl: string;
};

function statRow(label: string, value: number, note: string): string {
  return `<tr>
    <td style="padding:14px 0;border-top:1px solid ${C.fog};font-family:Arial,Helvetica,sans-serif;">
      <span style="font-size:14px;color:${C.stone};">${label}</span>
    </td>
    <td align="right" style="padding:14px 0;border-top:1px solid ${C.fog};font-family:Arial,Helvetica,sans-serif;">
      <span style="font-size:20px;font-weight:600;color:${C.ink};">${value}</span>
      ${note ? `<br><span style="font-size:12px;">${note}</span>` : ""}
    </td>
  </tr>`;
}

export function weeklyStatsEmail(d: WeeklyEmailData): Email {
  const delta =
    d.stampsDelta > 0
      ? `<span style="color:${C.moss};">&#9650; ${d.stampsDelta} flere end ugen før</span>`
      : d.stampsDelta < 0
        ? `<span style="color:${C.slate};">&#9660; ${Math.abs(d.stampsDelta)} færre end ugen før</span>`
        : `<span style="color:${C.slate};">samme som ugen før</span>`;

  const stats = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    ${statRow("Stempler denne uge", d.stampsWeek, delta)}
    ${statRow("Nye kunder", d.newCustomers, "")}
    ${statRow("Indløsninger", d.redemptions, "")}
  </table>`;

  const churnBlock =
    d.churn > 0
      ? `<p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${C.stone};">
      ${d.churn} ${d.churn === 1 ? "kunde er" : "kunder er"} ved at glide fra dig. Et lille skub kan hente dem tilbage.
    </p>`
      : "";

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.moss};">
      <a href="${d.dashboardUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Se dit dashboard</a>
    </td></tr></table>`;

  const inner = `
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      Her er din uge hos ${d.businessName}.
    </p>
    ${stats}
    ${churnBlock}
    ${button}`;

  const footerExtra = `<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:${C.slate};">
    Vil du ikke have ugebrevet? <a href="${d.unsubscribeUrl}" style="color:${C.slate};">Afmeld</a>.
  </p>`;

  const text = [
    `Her er din uge hos ${d.businessName}.`,
    "",
    `Stempler denne uge: ${d.stampsWeek} (${
      d.stampsDelta > 0
        ? `${d.stampsDelta} flere end ugen før`
        : d.stampsDelta < 0
          ? `${Math.abs(d.stampsDelta)} færre end ugen før`
          : "samme som ugen før"
    })`,
    `Nye kunder: ${d.newCustomers}`,
    `Indløsninger: ${d.redemptions}`,
    ...(d.churn > 0
      ? ["", `${d.churn} kunder er ved at glide fra dig. Et lille skub kan hente dem tilbage.`]
      : []),
    "",
    `Se dit dashboard: ${d.dashboardUrl}`,
    "",
    `Afmeld ugebrevet: ${d.unsubscribeUrl}`,
  ].join("\n");

  return {
    subject: `Din uge hos ${d.businessName}: ${d.stampsWeek} stempler`,
    html: shell("Din uge hos Stemplet.", inner, footerExtra),
    text,
  };
}

