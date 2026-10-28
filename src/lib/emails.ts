// Brandede mails i Stemplets tone og visuelle stil: professionel, enkel og
// menneskelig. Vi starter direkte, kommer hurtigt til pointen, forklarer
// vaerdien og slutter med et klart naeste skridt. Bygget med tabel-layout og
// inline styles, saa det ser ens ud i alle mail-klienter. Ingen lange
// bindestreger.

import { PLATFORM } from "./platform";
import { FOLKA_MAIL_LOGO } from "./folka-mail-logo";

// Praecis samme palette som sitet (globals.css @theme), saa mails og sider
// spiller sammen. Kun web-sikre fonts i selve mailen (Instrument Sans kan ikke
// embeddes paalideligt), men farverne er identiske med brandet.
const C = {
  parchment: "#FAF8F4",
  card: "#FFFFFF",
  terracotta: "#A6502E",
  tint: "#F7EDE7", // lys terracotta-tone til fremhaevede blokke
  ink: "#1C1917",
  stone: "#57534E",
  slate: "#78716C",
  fog: "#ECEAE5",
};

/** Inline-billede (cid) til Resend. */
export type MailAttachment = { filename: string; content: string; content_id: string };
type Email = { subject: string; html: string; text: string; attachments?: MailAttachment[] };

function shell(preheader: string, inner: string, footerExtra = ""): string {
  return `<!doctype html>
<html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.parchment};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.parchment};">
  <tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
      <tr><td style="padding:0 4px 20px;">
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;letter-spacing:-.02em;color:${C.ink};">Stemplet<span style="display:inline-block;width:6px;height:6px;margin-left:2px;border-radius:50%;background:${C.terracotta};vertical-align:baseline;"></span></span>
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

// Login og velkomst er faelles for alle Folka-produkter (Stemplet og
// Henvisninger), saa de baerer Folka: lys blaagraa baggrund, hvidt kort, Folkas
// moerkeblaa paa knappen og ordmaerket som inline-billede (cid), saa logoet ogsaa
// vises, naar appens domaene ikke er offentligt (fx testsiden).
const A = { bg: "#F3F5F9", card: "#FFFFFF", ink: "#0E1726", muted: "#5D6675", line: "#E4E8EF", surface: "#F3F5F9" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/** "Stemplet <login@x.dk>" -> "Folka <login@x.dk>" (kun navnet skiftes). */
export function folkaSender(from: string | undefined): string | undefined {
  if (!from) return from;
  const addr = /<([^>]+)>/.exec(from)?.[1] ?? from.trim();
  return `${PLATFORM.name} <${addr}>`;
}

/**
 * Rammen om Folka-mails. Uden `shopName` staar Folkas logo oeverst (mails til
 * butiksejeren); med `shopName` staar butikkens navn (mails til slutkunder,
 * som skal se butikken og ikke Folka).
 */
function folkaShell(preheader: string, inner: string, shopName?: string): string {
  const header = shopName
    ? `<span style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-.02em;color:${A.ink};">${shopName}</span>`
    : `<img src="cid:${FOLKA_MAIL_LOGO.content_id}" width="104" height="58" alt="${PLATFORM.name}" style="display:block;border:0;font-family:Georgia,serif;font-size:30px;font-style:italic;color:${PLATFORM.color};">`;
  return `<!doctype html>
<html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:${A.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${A.bg};">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
      <tr><td style="background:${A.card};border-radius:20px;padding:36px 36px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 28px;">${header}</td></tr>
          <tr><td>${inner}</td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:22px 16px 0;">
        <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${A.muted};">
          ${shopName ? `Sendt for ${shopName} af ` : ""}<a href="${PLATFORM.url}" style="color:${A.muted};text-decoration:underline;">${PLATFORM.name}</a>${shopName ? "" : ". Stemplet og Henvisninger."}
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function folkaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="border-radius:12px;background:${PLATFORM.color};">
      <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:12px;">${label}</a>
    </td></tr></table>`;
}

function folkaFallback(url: string, note: string): string {
  return `<p style="margin:28px 0 0;padding:24px 0 0;border-top:1px solid ${A.line};font-family:${FONT};font-size:13px;line-height:1.6;color:${A.muted};">${note}</p>
    <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${A.muted};word-break:break-all;">
      Virker knappen ikke? Kopiér linket: <a href="${url}" style="color:${A.muted};">${url}</a>
    </p>`;
}

/** Login-link (magic link). Bruges baade ved log ind og efter oprettelse. */
export function loginEmail(url: string): Email {
  const inner = `
    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.03em;color:${A.ink};">Log ind</h1>
    <p style="margin:0 0 28px;font-family:${FONT};font-size:16px;line-height:1.55;color:${A.muted};">
      Du er ét klik fra dit dashboard.
    </p>
    ${folkaButton(url, "Log ind")}
    ${folkaFallback(url, "Linket virker i kort tid og kun én gang. Har du ikke bedt om at logge ind, kan du roligt ignorere denne mail.")}`;

  const text = [
    "Log ind",
    "",
    "Du er ét klik fra dit dashboard (linket virker i kort tid og kun én gang):",
    url,
    "",
    "Har du ikke bedt om at logge ind, kan du roligt ignorere denne mail.",
    "",
    "Folka. Stemplet og Henvisninger.",
  ].join("\n");

  return { subject: "Dit login-link til Folka", html: folkaShell("Log ind på dit dashboard.", inner), text, attachments: [FOLKA_MAIL_LOGO] };
}

/** Gendan kortet: link til kunden, der virker een gang og i 30 minutter. */
export function cardRecoveryEmail(shopName: string, url: string): Email {
  const shop = esc(shopName);
  const inner = `
    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.03em;color:${A.ink};">Gendan dit kort</h1>
    <p style="margin:0 0 28px;font-family:${FONT};font-size:16px;line-height:1.55;color:${A.muted};">
      Tryk på knappen på den telefon, hvor du vil have dit kort hos ${shop}. Dine stempler og belønninger følger med.
    </p>
    ${folkaButton(url, "Gendan mit kort")}
    ${folkaFallback(url, "Linket virker i 30 minutter og kun én gang. Har du ikke bedt om at gendanne dit kort, kan du roligt ignorere denne mail.")}`;
  const text = [
    `Gendan dit kort hos ${shopName}`,
    "",
    "Åbn linket på den telefon, hvor du vil have dit kort (virker i 30 minutter og kun én gang):",
    url,
    "",
    "Har du ikke bedt om at gendanne dit kort, kan du roligt ignorere denne mail.",
  ].join("\n");
  return { subject: `Gendan dit kort hos ${shopName}`, html: folkaShell(`Dit kort hos ${shop}.`, inner, shop), text };
}

// ── Velkomst (foerste login efter oprettelse) ────────────────────────
// Sendes i stedet for login-mailen ved kundens ALLERFOERSTE login-link (lige
// efter oprettelsen, hvor emailVerified endnu er null). Samme magiske link.
export function welcomeEmail(url: string): Email {
  const steps = [
    "Sæt linket til din side på din hjemmeside.",
    "Hæng QR-koden op ved kassen.",
    "Tilføj det andet produkt i dashboardet, når du er klar.",
  ];
  const list = steps
    .map(
      (t, i) => `<tr>
        <td valign="top" style="padding:7px 12px 7px 0;font-family:${FONT};font-size:15px;font-weight:700;color:${A.ink};">${i + 1}</td>
        <td valign="top" style="padding:7px 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${A.ink};">${t}</td>
      </tr>`,
    )
    .join("");

  const inner = `
    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.03em;color:${A.ink};">Velkommen</h1>
    <p style="margin:0 0 28px;font-family:${FONT};font-size:16px;line-height:1.55;color:${A.muted};">
      Din butik er klar. Du logger ind uden adgangskode.
    </p>
    ${folkaButton(url, "Gå til dit dashboard")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;background:${A.surface};border-radius:16px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0 0 6px;font-family:${FONT};font-size:14px;font-weight:600;color:${A.muted};">Kom godt fra start</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${list}</table>
      </td></tr>
    </table>
    ${folkaFallback(url, "Linket virker i kort tid og kun én gang. Har du ikke oprettet en butik, kan du roligt ignorere denne mail.")}`;

  const text = [
    "Velkommen",
    "",
    "Din butik er klar. Du logger ind uden adgangskode:",
    url,
    "",
    "Kom godt fra start:",
    ...steps.map((t, i) => `${i + 1}. ${t}`),
    "",
    "Linket virker i kort tid og kun én gang. Har du ikke oprettet en butik, kan du roligt ignorere denne mail.",
    "",
    "Folka. Stemplet og Henvisninger.",
  ].join("\n");

  return { subject: "Velkommen til Folka", html: folkaShell("Din butik er klar. Log ind og kom i gang.", inner), text, attachments: [FOLKA_MAIL_LOGO] };
}

// ── Ugentlig statistik-mail ──────────────────────────────────────────

export type WeeklyEmailData = {
  businessName: string;
  stampsWeek: number;
  stampsDelta: number;
  newCustomers: number;
  redemptions: number;
  churn: number;
  topStamps: number;
  regulars: number;
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
      ? `<span style="color:${C.terracotta};">&#9650; ${d.stampsDelta} flere end ugen før</span>`
      : d.stampsDelta < 0
        ? `<span style="color:${C.slate};">&#9660; ${Math.abs(d.stampsDelta)} færre end ugen før</span>`
        : `<span style="color:${C.slate};">samme som ugen før</span>`;

  const stats = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    ${statRow("Stempler denne uge", d.stampsWeek, delta)}
    ${statRow("Nye kunder", d.newCustomers, "")}
    ${statRow("Indløsninger", d.redemptions, "")}
  </table>`;

  // Loyalitets-hoejdepunkt: en lille dopamin-hilsen til ejeren om deres stamkunder.
  const regularsNote =
    d.regulars > 0
      ? ` ${d.regulars} ${d.regulars === 1 ? "kunde har" : "kunder har"} rundet 100 stempler.`
      : "";
  const loyaltyBlock =
    d.topStamps > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;background:${C.tint};border-radius:10px;">
      <tr><td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;">
        <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.terracotta};">Stamkunder</span>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:${C.stone};">
          Din mest trofaste kunde har <span style="font-weight:700;color:${C.ink};">${d.topStamps}</span> stempler.${regularsNote}
        </p>
      </td></tr>
    </table>`
      : "";

  const churnBlock =
    d.churn > 0
      ? `<p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${C.stone};">
      ${d.churn} ${d.churn === 1 ? "kunde er" : "kunder er"} ved at glide fra dig. Et lille skub kan hente dem tilbage.
    </p>`
      : "";

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.dashboardUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Se dit dashboard</a>
    </td></tr></table>`;

  const inner = `
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      Her er din uge hos ${d.businessName}.
    </p>
    ${stats}
    ${loyaltyBlock}
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
    ...(d.topStamps > 0
      ? [
          "",
          `Stamkunder: din mest trofaste kunde har ${d.topStamps} stempler.${
            d.regulars > 0
              ? ` ${d.regulars} ${d.regulars === 1 ? "kunde har" : "kunder har"} rundet 100 stempler.`
              : ""
          }`,
        ]
      : []),
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

// ── Kortholder-varsel ved 80 (til ejeren) ────────────────────────────
// Venligt varsel, ingen betalingsmur. Ejeren har allerede accepteret modellen
// ved onboarding, saa det er varsling, ikke forhandling.

export type CardholderWarningData = {
  businessName: string;
  cardholders: number;
  limit: number;
  priceKr: number;
  agreementUrl: string;
};

export function cardholderWarningEmail(d: CardholderWarningData): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.agreementUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Se aftalen</a>
    </td></tr></table>`;

  const inner = `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      I nærmer jer ${d.limit} kortholdere.
    </p>
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      ${d.businessName} har nu ${d.cardholders} kortholdere. Ved ${d.limit} fortsætter I automatisk på Pro til ${d.priceKr} kr. per måned ekskl. moms. I skal ikke gøre noget, alt fortsætter præcis som i dag.
    </p>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      Ingen betalingsmur, ingen afbrydelse. Se jeres status og godkend aftalen, når det passer jer.
    </p>
    ${button}`;

  const text = [
    `I nærmer jer ${d.limit} kortholdere.`,
    "",
    `${d.businessName} har nu ${d.cardholders} kortholdere. Ved ${d.limit} fortsætter I automatisk på Pro til ${d.priceKr} kr. per måned ekskl. moms. I skal ikke gøre noget, alt fortsætter præcis som i dag.`,
    "",
    "Ingen betalingsmur, ingen afbrydelse. Se jeres status og godkend aftalen her:",
    d.agreementUrl,
    "",
    "Stemplet. Stempelkortet, der skaber flere gensyn.",
  ].join("\n");

  return {
    subject: `I nærmer jer ${d.limit} kortholdere hos Stemplet`,
    html: shell(`${d.businessName} nærmer sig ${d.limit} kortholdere.`, inner),
    text,
  };
}

// ── Kortholder-varsel ved 80 (til superadmin/Ali) ────────────────────

export type SuperadminThresholdData = {
  businessName: string;
  slug: string;
  cardholders: number;
  limit: number;
  ownerEmails: string;
  adminUrl: string;
};

export function superadminThresholdEmail(d: SuperadminThresholdData): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn admin</a>
    </td></tr></table>`;

  const inner = `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      ${d.businessName} nærmer sig ${d.limit} kortholdere.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
      ${statRow("Kortholdere", d.cardholders, `af ${d.limit}`)}
    </table>
    <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${C.stone};">
      Butik: ${d.businessName} (${d.slug})<br>
      Ejer: ${d.ownerEmails}
    </p>
    <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${C.stone};">
      Ejeren har fået varsel og et link til at godkende Pro-aftalen. Sæt evt. en individuel pris i admin, før de krydser ${d.limit}.
    </p>
    ${button}`;

  const text = [
    `${d.businessName} nærmer sig ${d.limit} kortholdere.`,
    "",
    `Kortholdere: ${d.cardholders} af ${d.limit}`,
    `Butik: ${d.businessName} (${d.slug})`,
    `Ejer: ${d.ownerEmails}`,
    "",
    `Ejeren har fået varsel og et godkendelses-link. Sæt evt. en individuel pris i admin, før de krydser ${d.limit}.`,
    d.adminUrl,
  ].join("\n");

  return {
    subject: `[Stemplet] ${d.businessName} nærmer sig ${d.limit} kortholdere`,
    html: shell(`${d.businessName}: ${d.cardholders} kortholdere.`, inner),
    text,
  };
}

// ── Faktura-trigger ved 100 (til superadmin/Ali) ─────────────────────
// 100-krydsningen ER faktureringstidspunktet i modellen, saa denne mail er selve
// triggeren for Billy-fakturaen. Den samler alt, man skal bruge for at fakturere
// direkte fra indbakken: navn, kortholdertal, individuel pris og hvornaar ejeren
// godkendte aftalen.

export type SuperadminInvoiceData = {
  businessName: string;
  slug: string;
  cardholders: number;
  limit: number;
  priceKr: number; // effektiv maanedspris (specialpris eller standard)
  standardPriceKr: number;
  approvedLabel: string; // formateret tidsstempel for godkendelsesklik, ellers besked
  ownerEmails: string;
  adminUrl: string;
};

export function superadminInvoiceEmail(d: SuperadminInvoiceData): Email {
  const priceNote =
    d.priceKr !== d.standardPriceKr
      ? `specialpris, standard er ${d.standardPriceKr} kr`
      : "standardpris";

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn admin</a>
    </td></tr></table>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.slate};">${label}</td>
      <td align="right" style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${C.ink};">${value}</td>
    </tr>`;

  const inner = `
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      ${d.businessName} har krydset ${d.limit} kortholdere.
    </p>
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      Det er faktureringstidspunktet. Her er alt, du skal bruge til Billy-fakturaen.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:10px;">
      <tr><td style="padding:14px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${detailRow("Kortholdere", `${d.cardholders} (krydsede ${d.limit})`)}
          ${detailRow("Pro-pris", `${d.priceKr} kr/md ekskl. moms`)}
          ${detailRow("Pris-note", priceNote)}
          ${detailRow("Aftale godkendt", d.approvedLabel)}
          ${detailRow("Butik", `${d.businessName} (${d.slug})`)}
          ${detailRow("Ejer", d.ownerEmails)}
        </table>
      </td></tr>
    </table>
    ${button}`;

  const text = [
    `${d.businessName} har krydset ${d.limit} kortholdere. Det er faktureringstidspunktet.`,
    "",
    "Til Billy-fakturaen:",
    `Kortholdere: ${d.cardholders} (krydsede ${d.limit})`,
    `Pro-pris: ${d.priceKr} kr/md ekskl. moms (${priceNote})`,
    `Aftale godkendt: ${d.approvedLabel}`,
    `Butik: ${d.businessName} (${d.slug})`,
    `Ejer: ${d.ownerEmails}`,
    "",
    `Åbn admin: ${d.adminUrl}`,
  ].join("\n");

  return {
    subject: `[Stemplet] Fakturér: ${d.businessName} har krydset ${d.limit} kortholdere`,
    html: shell(`${d.businessName} skal faktureres for Pro.`, inner),
    text,
  };
}

// ── Ny butik oprettet (til superadmin/Ali) ───────────────────────────
// I opstarten vil vi gerne have besked hver gang en butik melder sig, saa vi kan
// foelge med. Ren informationsmail: hvem, hvad og et hurtigt link til admin.

export type SuperadminNewBusinessData = {
  businessName: string;
  slug: string;
  ownerEmail: string;
  category: string; // laesbar label eller "(ingen)"
  address: string; // adresse eller "(ingen)"
  cardUrl: string;
  adminUrl: string;
};

export function superadminNewBusinessEmail(d: SuperadminNewBusinessData): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn admin</a>
    </td></tr></table>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.slate};">${label}</td>
      <td align="right" style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${C.ink};">${value}</td>
    </tr>`;

  const inner = `
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      Ny butik oprettet: ${d.businessName}.
    </p>
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      Endnu en butik er kommet med på Stemplet.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:10px;">
      <tr><td style="padding:14px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${detailRow("Butik", `${d.businessName} (${d.slug})`)}
          ${detailRow("Ejer", d.ownerEmail)}
          ${detailRow("Kategori", d.category)}
          ${detailRow("Adresse", d.address)}
        </table>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${C.stone};">
      Kortlink: <a href="${d.cardUrl}" style="color:${C.terracotta};">${d.cardUrl}</a>
    </p>
    ${button}`;

  const text = [
    `Ny butik oprettet: ${d.businessName}.`,
    "",
    `Butik: ${d.businessName} (${d.slug})`,
    `Ejer: ${d.ownerEmail}`,
    `Kategori: ${d.category}`,
    `Adresse: ${d.address}`,
    `Kortlink: ${d.cardUrl}`,
    "",
    `Åbn admin: ${d.adminUrl}`,
  ].join("\n");

  return {
    subject: `[Stemplet] Ny butik: ${d.businessName}`,
    html: shell(`Ny butik oprettet: ${d.businessName}.`, inner),
    text,
  };
}

// ── "Hold mig orienteret": velkomst (single opt-in) ──────────────────
// Kort kvittering efter tilmelding. Ingen handling kraevet: tilmeldingen er
// allerede aktiv (samtykke gemt med tid + IP ved tilmelding). Ingen salg, bare
// en varm bekraeftelse paa at de er med.

export function marketingWelcomeEmail(name?: string | null): Email {
  const hej = name && name.trim() ? `Hej ${name.trim()}.` : "Hej.";

  const inner = `
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      ${hej} Du er skrevet op.
    </p>
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      Tak, fordi du vil holde kontakten. Du hører fra os, når vi har inspiration, idéer eller nye muligheder at dele. Ingen spam, kun gode idéer.
    </p>
    <p style="margin:20px 0 0;padding-top:20px;border-top:1px solid ${C.fog};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.slate};">
      Har du ikke selv skrevet dig op, så skriv til os på hej@folka.dk, så fjerner vi dig med det samme.
    </p>`;

  const text = [
    `${hej} Du er skrevet op.`,
    "",
    "Tak, fordi du vil holde kontakten. Du hører fra os, når vi har inspiration, idéer eller nye muligheder at dele. Ingen spam, kun gode idéer.",
    "",
    "Har du ikke selv skrevet dig op, så skriv til os på hej@folka.dk, så fjerner vi dig med det samme.",
    "",
    "Stemplet. Stempelkortet, der skaber flere gensyn.",
  ].join("\n");

  return {
    subject: "Du er skrevet op hos Stemplet",
    html: shell("Tak, du er skrevet op hos Stemplet.", inner),
    text,
  };
}

// ── "Hold mig orienteret": ny bekraeftet tilmelding (til superadmin/Ali) ──

export type SuperadminMarketingSignupData = {
  name: string; // navn eller "(ingen)"
  storeName: string; // butiksnavn eller "(ingen)"
  email: string;
  source: string; // "forside", branche-slug eller "footer"
  adminUrl: string;
};

export function superadminMarketingSignupEmail(
  d: SuperadminMarketingSignupData,
): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn Marketing</a>
    </td></tr></table>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.slate};">${label}</td>
      <td align="right" style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${C.ink};">${value}</td>
    </tr>`;

  const inner = `
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      Ny bekræftet tilmelding.
    </p>
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      En ny person har bekræftet, at de gerne vil holde kontakten.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:10px;">
      <tr><td style="padding:14px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${detailRow("Navn", d.name)}
          ${detailRow("Butik", d.storeName)}
          ${detailRow("Mail", d.email)}
          ${detailRow("Kilde", d.source)}
        </table>
      </td></tr>
    </table>
    ${button}`;

  const text = [
    "Ny bekræftet tilmelding.",
    "",
    `Navn: ${d.name}`,
    `Butik: ${d.storeName}`,
    `Mail: ${d.email}`,
    `Kilde: ${d.source}`,
    "",
    `Åbn Marketing: ${d.adminUrl}`,
  ].join("\n");

  return {
    subject: `[Stemplet] Ny tilmelding: ${d.email}`,
    html: shell("Ny bekræftet tilmelding til Stemplet.", inner),
    text,
  };
}

export type SuperadminSignupRequestData = {
  businessName: string;
  reward: string;
  /** Saat, naar butikken ogsaa vil have Henvisninger. */
  referralReward?: string | null;
  /** Kun Henvisninger: opret butikken med Stemplet slaaet fra. */
  referralsOnly?: boolean;
  contactName: string; // navn eller "(ingen)"
  email: string;
  phone: string; // nummer eller "(ingen)"
  createUrl: string; // /app/ny-butik
};

// HTML-escape af brugerindtastet tekst, saa fri tekst i mailen ikke kan bryde
// layoutet eller injicere markup.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Notifikation til superadmin (Ali): en butik vil gerne oprettes. Ingen konto er
// lavet, saa naeste skridt er at lave et udkast og gaa i dialog.
export function superadminSignupRequestEmail(
  d: SuperadminSignupRequestData,
): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.createUrl}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Lav et udkast</a>
    </td></tr></table>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.slate};">${label}</td>
      <td align="right" style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${C.ink};">${esc(value)}</td>
    </tr>`;

  const inner = `
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:${C.ink};">
      Ny oprettelsesanmodning.
    </p>
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.stone};">
      ${d.referralsOnly ? "En butik vil gerne have Henvisninger uden stempelkort. Opret butikken, slå Henvisninger til og Stemplet fra i superadmin, og tag fat i dem." : d.referralReward ? "En butik vil gerne have Henvisninger. Lav et udkast, slå Henvisninger til i superadmin og tag fat i dem." : "En butik vil gerne have et stempelkort. Lav et udkast og tag fat i dem."}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:10px;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${C.slate};">Virksomhed</p>
        <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:${C.ink};">${esc(d.businessName)}</p>
        <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${C.slate};">Ønsket belønning</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${C.ink};">${esc(d.reward || "(ikke angivet)")}</p>
        ${d.referralReward ? `<p style="margin:14px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${C.slate};">Henvisninger</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${C.ink};">${esc(d.referralReward)}</p>` : ""}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid ${C.fog};">
          ${detailRow("Kontakt", d.contactName)}
          ${detailRow("Mail", d.email)}
          ${detailRow("Telefon", d.phone)}
        </table>
      </td></tr>
    </table>
    ${button}`;

  const text = [
    "Ny oprettelsesanmodning.",
    "",
    `Virksomhed: ${d.businessName}`,
    `Ønsket belønning: ${d.reward || "(ikke angivet)"}`,
    ...(d.referralReward ? [`Henvisninger: ${d.referralReward}`] : []),
    ...(d.referralsOnly ? ["Kun Henvisninger: slå Stemplet fra i superadmin."] : []),
    `Kontakt: ${d.contactName}`,
    `Mail: ${d.email}`,
    `Telefon: ${d.phone}`,
    "",
    `Lav et udkast: ${d.createUrl}`,
  ].join("\n");

  return {
    subject: `[Stemplet] Oprettelsesanmodning${d.referralsOnly ? " (kun Henvisninger)" : d.referralReward ? " (Henvisninger)" : ""}: ${d.businessName}`,
    html: shell("En butik vil gerne oprettes hos Stemplet.", inner),
    text,
  };
}

