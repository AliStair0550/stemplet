// Brandede mails i Folkas tone og visuelle stil: professionel, enkel og
// menneskelig. Vi starter direkte, kommer hurtigt til pointen, forklarer
// vaerdien og slutter med et klart naeste skridt. Bygget med tabel-layout og
// inline styles, saa det ser ens ud i alle mail-klienter. Ingen lange
// bindestreger.

import { PLATFORM } from "./platform";
import { FOLKA_MAIL_LOGO } from "./folka-mail-logo";
import { formatLoginCode, LOGIN_CODE_TTL_SECONDS } from "./login-code";

// Folkas palette (samme som dashboardet), saa mails og sider spiller sammen.
// Kun web-sikre fonts i selve mailen. Navnene er historiske: "terracotta" er
// accenten (Folkas blaa), "tint" den lyse blaa tone til fremhaevede blokke.
const C = {
  parchment: "#F3F5F9",
  card: "#FFFFFF",
  terracotta: "#1B5EAE",
  tint: "#E8F0FB",
  ink: "#0E1726",
  stone: "#5D6675",
  slate: "#8D98A8",
  fog: "#E4E8EF",
};

/** Inline-billede (cid) til Resend. */
export type MailAttachment = { filename: string; content: string; content_id: string };
type Email = { subject: string; html: string; text: string; attachments?: MailAttachment[] };

// Mails til butiksejeren (ugemail, proeveperiode, superadmin): samme ramme som
// login og velkomst, saa alle Folkas mails ser ens ud. footerExtra er fx et
// afmeldingslink under kortet.
function shell(preheader: string, inner: string, footerExtra = ""): string {
  return folkaShell(preheader, inner, undefined, footerExtra);
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
function folkaShell(preheader: string, inner: string, shopName?: string, footerExtra = ""): string {
  const header = shopName
    ? `<span style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-.02em;color:${A.ink};">${shopName}</span>`
    : `<img src="cid:${FOLKA_MAIL_LOGO.content_id}" width="50" height="28" alt="${PLATFORM.name}" style="display:block;border:0;font-family:Georgia,serif;font-size:22px;font-style:italic;color:${PLATFORM.color};">`;
  return `<!doctype html>
<html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:${A.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${A.bg};">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
      <tr><td style="background:${A.card};border-radius:20px;padding:36px 36px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 24px;">${header}</td></tr>
          <tr><td>${inner}</td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:22px 16px 0;">
        <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${A.muted};">
          ${shopName ? `Sendt for ${shopName} af <a href="${PLATFORM.url}" style="color:${A.muted};text-decoration:underline;">${PLATFORM.name}</a>` : `Folka Kort &middot; <a href="https://kort.folka.dk" style="color:${A.muted};text-decoration:none;">kort.folka.dk</a>`}
        </p>
        ${footerExtra}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// Velkomstkortet oeverst i velkomstmails: et lille Wallet-kort i Folkas farve med
// stempler, saa mailen viser, hvad butikken har faaet, i stedet for kun tekst.
// Tabeller og inline styles, saa det holder i alle mailprogrammer (Outlook viser
// stemplerne som firkanter, men kortet staar stadig).
function welcomeCard(): string {
  const dot = (filled: boolean) =>
    `<td style="padding:0 5px 0 0;"><div style="width:22px;height:22px;border-radius:11px;${
      filled ? "background:#FFFFFF;" : "border:2px solid rgba(255,255,255,.45);box-sizing:border-box;"
    }"></div></td>`;
  const row = (from: number) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr>${Array.from({ length: 5 }, (_, k) => dot(from + k < 3)).join("")}</tr></table>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="background:${PLATFORM.color};background-image:linear-gradient(135deg,${PLATFORM.color} 0%,#1B5EAE 100%);border-radius:18px;padding:20px 22px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:${FONT};font-size:15px;font-weight:700;color:#FFFFFF;">Din butik</td>
            <td align="right" style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7);">Stempler <span style="font-size:15px;letter-spacing:0;color:#FFFFFF;">3/10</span></td>
          </tr>
          <tr><td colspan="2" style="padding:18px 0 6px;">${row(0)}${row(5)}</td></tr>
          <tr><td colspan="2" style="border-top:1px solid rgba(255,255,255,.2);padding:12px 0 0;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7);">Belønning<br><span style="font-size:15px;letter-spacing:0;text-transform:none;color:#FFFFFF;">Din belønning til stamkunder</span></td></tr>
        </table>
      </td></tr>
    </table>`;
}

/** Nummererede trin med smaa blaa cirkler. */
function welcomeSteps(title: string, steps: string[]): string {
  const list = steps
    .map(
      (t, i) => `<tr>
        <td valign="top" style="padding:6px 12px 6px 0;width:26px;">
          <div style="width:24px;height:24px;border-radius:12px;background:${C.tint};font-family:${FONT};font-size:13px;line-height:24px;font-weight:700;text-align:center;color:${C.terracotta};">${i + 1}</div>
        </td>
        <td valign="top" style="padding:8px 0 6px;font-family:${FONT};font-size:15px;line-height:1.5;color:${A.ink};">${t}</td>
      </tr>`,
    )
    .join("");
  return `<p style="margin:0 0 6px;font-family:${FONT};font-size:14px;font-weight:600;color:${A.muted};">${title}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">${list}</table>`;
}

function folkaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="border-radius:12px;background:${PLATFORM.color};">
      <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:12px;">${label}</a>
    </td></tr></table>`;
}

function folkaFallback(url: string, note: string): string {
  return `<p style="margin:28px 0 0;padding:24px 0 0;border-top:1px solid ${A.line};font-family:${FONT};font-size:13px;line-height:1.6;color:${A.muted};">${note}</p>
    <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${A.muted};">
      Virker knappen ikke? <a href="${url}" style="color:${A.muted};text-decoration:underline;">Åbn linket her</a>.
    </p>`;
}

// Smaa ideer i login-mailen, saa den giver lidt mere end et link. Een pr. dag
// (samme idé hele dagen, ny i morgen).
const TIPS = [
  "Spørg ved kassen: »Har du vores kundekort?« Det er den hurtigste vej til nye stamkunder.",
  "Hæng QR-koden, hvor kunderne venter. Ved kassen eller på bordet virker bedst.",
  "Et velkomststempel gør første besøg til en lille gevinst. Slå det til under Regler.",
  "Kig på Statistik: hvem kommer oftest? De er værd at sige tak til.",
  "Kunder, der henviser en ven, er dine bedste ambassadører. Nævn det, når de betaler.",
  "En belønning, der er let at nå, får kunderne til at komme igen. 8 til 10 stempler er et godt sted at starte.",
];

export function tipOfTheDay(now: Date = new Date()): string {
  const day = Math.floor(now.getTime() / 86_400_000);
  return TIPS[day % TIPS.length];
}

const CODE_MINUTES = Math.round(LOGIN_CODE_TTL_SECONDS / 60);

/** Koden stort og tydeligt, til at skrive ind paa login-siden. */
function folkaCode(code: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td align="center" style="background:${A.surface};border-radius:16px;padding:22px 16px 20px;">
        <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;font-weight:600;color:${A.muted};">Din kode</p>
        <p style="margin:0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:.12em;color:${A.ink};">${formatLoginCode(code)}</p>
      </td></tr>
    </table>`;
}

/** Koden i en lille linje (velkomst): den vigtige del af mailen er velkomsten. */
function folkaCodeCompact(code: string): string {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:14px;color:${A.muted};">
      Din login-kode: <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:17px;font-weight:700;letter-spacing:.08em;color:${A.ink};">${formatLoginCode(code)}</span>
    </p>`;
}

function folkaTip(tip: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr><td style="border-left:3px solid ${C.terracotta};padding:2px 0 2px 14px;">
        <p style="margin:0 0 4px;font-family:${FONT};font-size:13px;font-weight:600;color:${C.terracotta};">Dagens idé</p>
        <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.55;color:${A.ink};">${tip}</p>
      </td></tr>
    </table>`;
}

/** Login: kode og link i samme mail (samme engangs-login). */
export function loginEmail(url: string, code: string): Email {
  const tip = tipOfTheDay();
  const inner = `
    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.03em;color:${A.ink};">Velkommen tilbage</h1>
    <p style="margin:0 0 24px;font-family:${FONT};font-size:16px;line-height:1.55;color:${A.muted};">
      Dine stamkunder venter. Skriv koden på login-siden, eller log ind med ét tryk.
    </p>
    ${folkaCode(code)}
    ${folkaButton(url, "Log ind")}
    ${folkaTip(tip)}
    ${folkaFallback(url, `Koden og linket virker i ${CODE_MINUTES} minutter og kun én gang. Har du ikke bedt om at logge ind, kan du roligt ignorere denne mail.`)}`;

  const text = [
    "Velkommen tilbage",
    "",
    `Din kode: ${formatLoginCode(code)}`,
    "",
    "Skriv koden på login-siden, eller åbn linket:",
    url,
    "",
    `Dagens idé: ${tip}`,
    "",
    `Koden og linket virker i ${CODE_MINUTES} minutter og kun én gang. Har du ikke bedt om at logge ind, kan du roligt ignorere denne mail.`,
    "",
    "Folka Kort.",
  ].join("\n");

  // Koden i emnet: iPhone foreslaar den selv i kodefeltet, og den kan ses uden
  // at aabne mailen.
  return { subject: `Din login-kode: ${code}`, html: folkaShell(`Din kode er ${formatLoginCode(code)}.`, inner), text, attachments: [FOLKA_MAIL_LOGO] };
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
export function welcomeEmail(url: string, code: string): Email {
  const steps = [
    "Sæt linket til din side på din hjemmeside.",
    "Hæng QR-koden op ved kassen.",
    "Slå henvisninger til under Regler, når du er klar.",
  ];
  const inner = `
    ${welcomeCard()}
    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.03em;color:${A.ink};">Velkommen til Folka Kort</h1>
    <p style="margin:0 0 26px;font-family:${FONT};font-size:16px;line-height:1.55;color:${A.muted};">
      Din butik er klar. Om lidt har dine kunder dit kort i lommen, og hvert besøg bliver en grund til at komme igen.
    </p>
    ${welcomeSteps("Kom godt fra start", steps)}
    ${folkaCodeCompact(code)}
    ${folkaButton(url, "Log ind")}
    ${folkaFallback(url, `Koden og linket virker i ${CODE_MINUTES} minutter og kun én gang. Har du ikke oprettet en butik, kan du roligt ignorere denne mail.`)}`;

  const text = [
    "Velkommen til Folka Kort",
    "",
    "Din butik er klar. Om lidt har dine kunder dit kort i lommen.",
    "",
    `Din kode: ${formatLoginCode(code)}`,
    "",
    "Skriv koden på login-siden, eller åbn linket:",
    url,
    "",
    "Kom godt fra start:",
    ...steps.map((t, i) => `${i + 1}. ${t}`),
    "",
    `Koden og linket virker i ${CODE_MINUTES} minutter og kun én gang. Har du ikke oprettet en butik, kan du roligt ignorere denne mail.`,
    "",
    "Folka Kort.",
  ].join("\n");

  return { subject: "Velkommen til Folka Kort", html: folkaShell("Din butik er klar. Log ind og kom i gang.", inner), text, attachments: [FOLKA_MAIL_LOGO] };
}

// ── Velkomst efter selvbetjent oprettelse ────────────────────────────
// Ejeren er allerede logget ind (auto-login), saa mailen har ingen kode: kun
// velkomst, de tre naeste skridt og en knap til dashboardet.
export function signupWelcomeEmail(dashboardUrl: string): Email {
  const steps = ["Giv kortet dine farver og dit logo under Design.", "Hæng QR-koden op ved kassen.", "Del kortet med dine kunder."];
  const inner = `
    ${welcomeCard()}
    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.03em;color:${A.ink};">Velkommen til Folka Kort</h1>
    <p style="margin:0 0 26px;font-family:${FONT};font-size:16px;line-height:1.55;color:${A.muted};">
      Din butik er klar. Om lidt har dine kunder dit kort i lommen, og hvert besøg bliver en grund til at komme igen.
    </p>
    ${welcomeSteps("Tre skridt, så er du i gang", steps)}
    ${folkaButton(dashboardUrl, "Gå til dit dashboard")}`;
  const text = [
    "Velkommen til Folka Kort",
    "",
    "Din butik er klar. Om lidt har dine kunder dit kort i lommen.",
    "",
    "Tre skridt, så er du i gang:",
    ...steps.map((t, i) => `${i + 1}. ${t}`),
    "",
    `Dit dashboard: ${dashboardUrl}`,
    "",
    "Folka Kort.",
  ].join("\n");
  return { subject: "Velkommen til Folka Kort", html: folkaShell("Din butik er klar. Tre skridt, så er du i gang.", inner), text, attachments: [FOLKA_MAIL_LOGO] };
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
  /** Henvisninger: nye venner, foerste besoeg og belønninger fra henvisninger givet. */
  referralsNew: number;
  referralVisits: number;
  referralRewards: number;
  stampsEnabled: boolean;
  referralsEnabled: boolean;
  dashboardUrl: string;
  unsubscribeUrl: string;
};

function statRow(label: string, value: number, note: string): string {
  return `<tr>
    <td style="padding:14px 0;border-top:1px solid ${C.fog};font-family:${FONT};">
      <span style="font-size:14px;color:${C.stone};">${label}</span>
    </td>
    <td align="right" style="padding:14px 0;border-top:1px solid ${C.fog};font-family:${FONT};">
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

  // Belønninger givet: fulde stempelkort og belønninger fra henvisninger.
  const rewardsGiven = d.redemptions + d.referralRewards;
  const rewardsNote =
    d.stampsEnabled && d.referralsEnabled && rewardsGiven > 0
      ? `<span style="color:${C.slate};">${d.redemptions} stempelkort, ${d.referralRewards} fra henvisninger</span>`
      : "";
  const stats = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    ${d.stampsEnabled ? statRow("Stempler", d.stampsWeek, delta) : ""}
    ${statRow("Nye kunder", d.newCustomers, "")}
    ${statRow("Belønninger givet", rewardsGiven, rewardsNote)}
  </table>`;

  // Henvisninger: kun for butikker med modulet.
  const referralBlock = d.referralsEnabled
    ? `<p style="margin:26px 0 4px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.terracotta};">Henvisninger</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${statRow("Venner henvist", d.referralsNew, "")}
      ${statRow("Første besøg", d.referralVisits, "")}
    </table>`
    : "";

  // Loyalitets-hoejdepunkt: en lille dopamin-hilsen til ejeren om deres stamkunder.
  const regularsNote =
    d.regulars > 0
      ? ` ${d.regulars} ${d.regulars === 1 ? "kunde har" : "kunder har"} rundet 100 stempler.`
      : "";
  const loyaltyBlock =
    d.topStamps > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;background:${C.tint};border-radius:10px;">
      <tr><td style="padding:16px 18px;font-family:${FONT};">
        <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.terracotta};">Stamkunder</span>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:${C.stone};">
          Din mest trofaste kunde har <span style="font-weight:700;color:${C.ink};">${d.topStamps}</span> stempler.${regularsNote}
        </p>
      </td></tr>
    </table>`
      : "";

  const churnBlock =
    d.churn > 0
      ? `<p style="margin:20px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.stone};">
      ${d.churn} ${d.churn === 1 ? "kunde er" : "kunder er"} ved at glide fra dig. Et lille skub kan hente dem tilbage.
    </p>`
      : "";

  const inner = `
    <h1 style="margin:0 0 6px;font-family:${FONT};font-size:26px;line-height:1.15;font-weight:700;letter-spacing:-.03em;color:${A.ink};">Din uge hos ${esc(d.businessName)}</h1>
    <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.55;color:${A.muted};">De seneste syv dage.</p>
    ${stats}
    ${referralBlock}
    ${d.stampsEnabled ? loyaltyBlock : ""}
    ${d.stampsEnabled ? churnBlock : ""}
    <div style="height:26px;line-height:26px;">&nbsp;</div>
    ${folkaButton(d.dashboardUrl, "Se dit dashboard")}`;

  const footerExtra = `<p style="margin:8px 0 0;font-family:${FONT};font-size:11px;line-height:1.6;color:${C.slate};">
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
    `Belønninger givet: ${d.redemptions + d.referralRewards}`,
    ...(d.referralsEnabled ? [`Venner henvist: ${d.referralsNew}`, `Første besøg: ${d.referralVisits}`] : []),
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
    subject: d.stampsEnabled
      ? `Din uge hos ${d.businessName}: ${d.stampsWeek} stempler`
      : `Din uge hos ${d.businessName}: ${d.referralsNew} ${d.referralsNew === 1 ? "ven henvist" : "venner henvist"}`,
    html: shell("Din uge med Folka Kort.", inner, footerExtra),
    text,
  };
}

// ── Proeveperioden slutter snart (til ejeren) ───────────────────────
// Venligt varsel 14 dage foer (eller med det samme, hvis perioden allerede er
// slut). Ingen betalingsmur; fakturering er manuel og sker foerst bagefter.

export type TrialEndingData = {
  businessName: string;
  /** "12. januar 2027" */
  endsOn: string;
  /** Proeveperioden er allerede slut. */
  ended: boolean;
  priceKr: number;
  agreementUrl: string;
};

export function trialEndingEmail(d: TrialEndingData): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.agreementUrl}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Se abonnementet</a>
    </td></tr></table>`;
  const head = d.ended ? "Dine tre gratis måneder er gået." : `Dine tre gratis måneder slutter ${d.endsOn}.`;
  const body = d.ended
    ? `${d.businessName} fortsætter på Folka Kort til ${d.priceKr} kr. om måneden ekskl. moms. Du skal ikke gøre noget. Alt kører videre som i dag, og du får en faktura om måneden.`
    : `Derefter koster Folka Kort ${d.priceKr} kr. om måneden ekskl. moms for ${d.businessName}. Du skal ikke gøre noget. Alt kører videre som i dag, og du får en faktura om måneden.`;

  const inner = `
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${A.ink};">
      ${esc(head)}
    </h1>
    <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.stone};">
      ${esc(body)}
    </p>
    <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.stone};">
      Ingen binding. Ubegrænset antal kortholdere. Se dit abonnement og bekræft det, når det passer dig.
    </p>
    ${button}`;

  const text = [head, "", body, "", "Ingen binding. Ubegrænset antal kortholdere. Se dit abonnement her:", d.agreementUrl, "", "Folka Kort."].join("\n");

  return {
    subject: d.ended ? "Dine gratis måneder på Folka Kort er gået" : `Dine gratis måneder på Folka Kort slutter ${d.endsOn}`,
    html: shell(head, inner),
    text,
  };
}

// ── Proeveperioden slutter snart (til superadmin/Ali) ───────────────

export type SuperadminTrialEndingData = {
  businessName: string;
  slug: string;
  endsOn: string;
  cardholders: number;
  ownerEmails: string;
  adminUrl: string;
};

export function superadminTrialEndingEmail(d: SuperadminTrialEndingData): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn admin</a>
    </td></tr></table>`;

  const inner = `
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${A.ink};">
      ${esc(d.businessName)}: gratis periode slutter ${esc(d.endsOn)}.
    </h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
      ${statRow("Kortholdere", d.cardholders, "i dag")}
    </table>
    <p style="margin:16px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.stone};">
      Butik: ${esc(d.businessName)} (${d.slug})<br>
      Ejer: ${esc(d.ownerEmails)}
    </p>
    <p style="margin:12px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.stone};">
      Ejeren har fået varsel og et link til abonnementet. Sæt evt. en individuel pris i admin, før perioden slutter.
    </p>
    ${button}`;

  const text = [
    `${d.businessName}: gratis periode slutter ${d.endsOn}.`,
    "",
    `Kortholdere i dag: ${d.cardholders}`,
    `Butik: ${d.businessName} (${d.slug})`,
    `Ejer: ${d.ownerEmails}`,
    "",
    "Ejeren har fået varsel. Sæt evt. en individuel pris i admin, før perioden slutter.",
    d.adminUrl,
  ].join("\n");

  return {
    subject: `[Folka Kort] ${d.businessName}: gratis periode slutter ${d.endsOn}`,
    html: shell(`${esc(d.businessName)}: gratis periode slutter.`, inner),
    text,
  };
}

// ── Faktura-trigger, naar proeveperioden er slut (til superadmin/Ali) ─
// Dagen efter de tre gratis maaneder ER faktureringstidspunktet, saa denne mail
// er selve triggeren for Billy-fakturaen og samler alt, man skal bruge.

export type SuperadminInvoiceData = {
  businessName: string;
  slug: string;
  cardholders: number;
  /** "12. januar 2027": sidste gratis dag. */
  trialEndedOn: string;
  priceKr: number; // effektiv maanedspris (specialpris eller standard)
  standardPriceKr: number;
  approvedLabel: string; // formateret tidsstempel for godkendelsesklik, ellers besked
  ownerEmails: string;
  adminUrl: string;
};

export function superadminInvoiceEmail(d: SuperadminInvoiceData): Email {
  const priceNote = d.priceKr !== d.standardPriceKr ? `specialpris, standard er ${d.standardPriceKr} kr` : "standardpris";

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn admin</a>
    </td></tr></table>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-family:${FONT};font-size:14px;color:${C.slate};">${label}</td>
      <td align="right" style="padding:7px 0;font-family:${FONT};font-size:14px;font-weight:600;color:${C.ink};">${esc(value)}</td>
    </tr>`;

  const inner = `
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${A.ink};">
      ${esc(d.businessName)}: de tre gratis måneder er gået.
    </h1>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.stone};">
      Det er faktureringstidspunktet. Her er alt, du skal bruge til Billy-fakturaen.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:10px;">
      <tr><td style="padding:14px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${detailRow("Sidste gratis dag", d.trialEndedOn)}
          ${detailRow("Pris", `${d.priceKr} kr/md ekskl. moms`)}
          ${detailRow("Pris-note", priceNote)}
          ${detailRow("Kortholdere", String(d.cardholders))}
          ${detailRow("Abonnement bekræftet", d.approvedLabel)}
          ${detailRow("Butik", `${d.businessName} (${d.slug})`)}
          ${detailRow("Ejer", d.ownerEmails)}
        </table>
      </td></tr>
    </table>
    ${button}`;

  const text = [
    `${d.businessName}: de tre gratis måneder er gået. Det er faktureringstidspunktet.`,
    "",
    "Til Billy-fakturaen:",
    `Sidste gratis dag: ${d.trialEndedOn}`,
    `Pris: ${d.priceKr} kr/md ekskl. moms (${priceNote})`,
    `Kortholdere: ${d.cardholders}`,
    `Abonnement bekræftet: ${d.approvedLabel}`,
    `Butik: ${d.businessName} (${d.slug})`,
    `Ejer: ${d.ownerEmails}`,
    "",
    `Åbn admin: ${d.adminUrl}`,
  ].join("\n");

  return {
    subject: `[Folka Kort] Fakturér: ${d.businessName} er færdig med de gratis måneder`,
    html: shell(`${esc(d.businessName)} skal faktureres.`, inner),
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
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn admin</a>
    </td></tr></table>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-family:${FONT};font-size:14px;color:${C.slate};">${label}</td>
      <td align="right" style="padding:7px 0;font-family:${FONT};font-size:14px;font-weight:600;color:${C.ink};">${esc(value)}</td>
    </tr>`;

  const inner = `
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${A.ink};">
      Ny butik oprettet: ${esc(d.businessName)}.
    </h1>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.stone};">
      Endnu en butik er kommet med på Kundekort.
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
    <p style="margin:18px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.stone};">
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
    subject: `[Folka Kort] Ny butik: ${d.businessName}`,
    html: shell(`Ny butik oprettet: ${esc(d.businessName)}.`, inner),
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
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${A.ink};">
      ${esc(hej)} Du er skrevet op.
    </h1>
    <p style="margin:0 0 8px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.stone};">
      Tak, fordi du vil holde kontakten. Du hører fra os, når vi har inspiration, idéer eller nye muligheder at dele. Ingen spam, kun gode idéer.
    </p>
    <p style="margin:20px 0 0;padding-top:20px;border-top:1px solid ${C.fog};font-family:${FONT};font-size:12px;line-height:1.6;color:${C.slate};">
      Har du ikke selv skrevet dig op, så skriv til os på hej@folka.dk, så fjerner vi dig med det samme.
    </p>`;

  const text = [
    `${hej} Du er skrevet op.`,
    "",
    "Tak, fordi du vil holde kontakten. Du hører fra os, når vi har inspiration, idéer eller nye muligheder at dele. Ingen spam, kun gode idéer.",
    "",
    "Har du ikke selv skrevet dig op, så skriv til os på hej@folka.dk, så fjerner vi dig med det samme.",
    "",
    "Folka Kort.",
  ].join("\n");

  return {
    subject: "Du er skrevet op hos Folka",
    html: shell("Tak, du er skrevet op hos Folka.", inner),
    text,
  };
}

// ── "Hold mig orienteret": ny bekraeftet tilmelding (til superadmin/Ali) ──

export type SuperadminMarketingSignupData = {
  name: string; // navn eller "(ingen)"
  storeName: string; // butiksnavn eller "(ingen)"
  email: string;
  /** Mobil fra "Hør mere": ring og saet dem i gang. */
  phone?: string | null;
  source: string; // "forside", branche-slug eller "footer"
  adminUrl: string;
};

export function superadminMarketingSignupEmail(
  d: SuperadminMarketingSignupData,
): Email {
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td style="border-radius:8px;background:${C.ink};">
      <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn Marketing</a>
    </td></tr></table>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;font-family:${FONT};font-size:14px;color:${C.slate};">${label}</td>
      <td align="right" style="padding:7px 0;font-family:${FONT};font-size:14px;font-weight:600;color:${C.ink};">${esc(value)}</td>
    </tr>`;

  const inner = `
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${A.ink};">
      Ny bekræftet tilmelding.
    </h1>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.stone};">
      ${d.phone ? "En ny person vil gerne høre mere. Ring og sæt dem i gang." : "En ny person har bekræftet, at de gerne vil holde kontakten."}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:10px;">
      <tr><td style="padding:14px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${detailRow("Navn", d.name)}
          ${detailRow("Butik", d.storeName)}
          ${detailRow("Mail", d.email)}
          ${d.phone ? detailRow("Mobil", d.phone) : ""}
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
    ...(d.phone ? [`Mobil: ${d.phone}`] : []),
    `Kilde: ${d.source}`,
    "",
    `Åbn Marketing: ${d.adminUrl}`,
  ].join("\n");

  return {
    subject: `[Folka Kort] Ny tilmelding: ${d.email}`,
    html: shell("Ny bekræftet tilmelding til Kundekort.", inner),
    text,
  };
}

export type SuperadminCancellationData = {
  shop: string;
  email: string;
  /** true: opsagt. false: opsigelsen er fortrudt. */
  cancelled: boolean;
  /** Sidste dag kortet koerer, fx "1. mar. 2027". */
  lastDay: string;
  adminUrl: string;
};

/** Til Ali: en butik har opsagt (eller fortrudt sin opsigelse). */
export function superadminCancellationEmail(d: SuperadminCancellationData): Email {
  const title = d.cancelled ? "En butik har opsagt." : "En butik har fortrudt sin opsigelse.";
  const lead = d.cancelled
    ? `Kortet kører til og med ${esc(d.lastDay)}. Ring gerne og hør hvorfor.`
    : "Abonnementet kører videre som før.";
  const inner = `
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${A.ink};">
      ${title}
    </h1>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.stone};">${lead}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.tint};border-radius:10px;">
      <tr><td style="padding:14px 18px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.ink};">
        <strong>${esc(d.shop)}</strong><br />${esc(d.email)}
      </td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
      <td style="border-radius:8px;background:${C.ink};">
        <a href="${d.adminUrl}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#FAF8F4;text-decoration:none;border-radius:8px;">Åbn admin</a>
      </td></tr></table>`;
  const text = [title, "", d.cancelled ? `Kortet kører til og med ${d.lastDay}.` : "Abonnementet kører videre.", "", d.shop, d.email, "", `Åbn admin: ${d.adminUrl}`].join("\n");
  return {
    subject: `[Folka Kort] ${d.cancelled ? "Opsagt" : "Opsigelse fortrudt"}: ${d.shop}`,
    html: shell(title, inner),
    text,
  };
}

// HTML-escape af brugerindtastet tekst, saa fri tekst i mailen ikke kan bryde
// layoutet eller injicere markup.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

