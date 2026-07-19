// Brandede mails i Stemplets tone og visuelle stil: professionel, enkel og
// menneskelig. Vi starter direkte, kommer hurtigt til pointen, forklarer
// vaerdien og slutter med et klart naeste skridt. Bygget med tabel-layout og
// inline styles, saa det ser ens ud i alle mail-klienter. Ingen lange
// bindestreger.

const C = {
  parchment: "#FAF8F4",
  card: "#FFFFFF",
  terracotta: "#A6502E",
  tint: "#F7EDE7", // lys terracotta-tone til fremhaevede blokke
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
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:${C.ink};letter-spacing:.02em;">Stemplet<span style="color:${C.terracotta};">.</span></span>
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
    <td style="border-radius:8px;background:${C.ink};">
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
      <a href="${url}" style="color:${C.terracotta};">${url}</a>
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

