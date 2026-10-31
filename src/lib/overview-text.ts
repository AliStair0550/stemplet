import { formatDkNumber } from "./utils";

// Tekster til dashboardets overblik (Hjem og Stemplet): hilsen og dagens status
// i almindeligt dansk. Flyttet uaendret fra Stemplets overblik, saa begge sider
// siger det samme.

// Hilsen efter tid paa dagen (dansk tid). en-GB giver 00-23 uden lokale-quirks.
export function greetingFor(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Copenhagen",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  if (hour < 10) return "Godmorgen";
  if (hour < 12) return "God formiddag";
  if (hour < 18) return "God eftermiddag";
  return "Godaften";
}

// Én sætning i almindeligt dansk: hvordan går dagen? Bygget af dagens tal, saa
// ejeren forstaar situationen paa faa sekunder uden at laese noegletal.
export function summaryLine(p: {
  totalCustomers: number;
  activeCustomers: number;
  visitorsToday: number;
  returningToday: number;
}): string {
  if (p.totalCustomers === 0) {
    return "Velkommen. Du er klar til din første kunde.";
  }
  if (p.visitorsToday === 0) {
    // "Aktiv" bruges KUN om kortholdere der faktisk har faaet et stempel for
    // nylig (activeCustomers = stemplet inden for 60 dage). Har ingen et stempel
    // endnu, siger vi neutralt "kortholdere, klar til det foerste stempel", saa
    // et tomt kort ikke fremstaar som en engageret kunde.
    if (p.activeCustomers > 0) {
      return `Ingen stempler endnu i dag. Du har ${formatDkNumber(
        p.activeCustomers,
      )} ${
        p.activeCustomers === 1 ? "aktiv kortholder" : "aktive kortholdere"
      }, klar til et genbesøg.`;
    }
    return `Ingen stempler endnu i dag. Du har ${formatDkNumber(
      p.totalCustomers,
    )} ${
      p.totalCustomers === 1 ? "kortholder" : "kortholdere"
    }, klar til det første stempel.`;
  }
  if (p.returningToday === 0) {
    return `${formatDkNumber(p.visitorsToday)} ${
      p.visitorsToday === 1 ? "ny kunde har" : "nye kunder har"
    } besøgt dig i dag.`;
  }
  return `${formatDkNumber(p.visitorsToday)} ${
    p.visitorsToday === 1 ? "kunde har" : "kunder har"
  } besøgt dig i dag, ${formatDkNumber(p.returningToday)} af dem er kommet igen.`;
}

/** Hjem-linjen for en butik med kun Henvisninger (ingen stempler at taelle). */
export function referralSummaryLine(p: { totalCustomers: number; newThisMonth: number; waiting: number }): string {
  if (p.totalCustomers === 0) {
    return "Velkommen. Del linket til din henvisningsside, så kommer de første kunder.";
  }
  const n = formatDkNumber(p.newThisMonth);
  const base = `Du har ${formatDkNumber(p.totalCustomers)} ${p.totalCustomers === 1 ? "kunde" : "kunder"}. ${n} ${
    p.newThisMonth === 1 ? "ny kunde" : "nye kunder"
  } via henvisninger denne måned.`;
  return p.waiting > 0 ? `${base} ${formatDkNumber(p.waiting)} venter på første besøg.` : base;
}

/** Foerste bogstav smaat midt i en saetning ("Gratis kaffe" -> "gratis kaffe"), ikke forkortelser. */
export function midSentence(v: string): string {
  const t = v.trim();
  return /^\p{Lu}\p{Ll}/u.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

/**
 * Butikkens faerdige besked, naar den deler kortet med sine kunder ("Del
 * kortet" paa Hjem). Linket saettes efter teksten af delingen selv.
 */
export function cardShareText(o: {
  stampsEnabled: boolean;
  stampsRequired: number;
  rewardText: string;
  friendReward: string | null;
  referrerReward: string | null;
}): string {
  const intro = "Hent vores kundekort på telefonen.";
  if (o.stampsEnabled && o.rewardText.trim()) {
    return `${intro} ${o.stampsRequired} stempler giver ${midSentence(o.rewardText)}:`;
  }
  if (o.friendReward && o.referrerReward) {
    return `${intro} Del det med en ven: vennen får ${o.friendReward}, og du får ${o.referrerReward}:`;
  }
  return `${intro} Det tager få sekunder:`;
}
