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
    return "Velkommen. I er klar til at tage imod jeres første kunde.";
  }
  if (p.visitorsToday === 0) {
    // "Aktiv" bruges KUN om kortholdere der faktisk har faaet et stempel for
    // nylig (activeCustomers = stemplet inden for 60 dage). Har ingen et stempel
    // endnu, siger vi neutralt "kortholdere, klar til det foerste stempel", saa
    // et tomt kort ikke fremstaar som en engageret kunde.
    if (p.activeCustomers > 0) {
      return `Ingen stempler endnu i dag. I har ${formatDkNumber(
        p.activeCustomers,
      )} ${
        p.activeCustomers === 1 ? "aktiv kortholder" : "aktive kortholdere"
      }, klar til et genbesøg.`;
    }
    return `Ingen stempler endnu i dag. I har ${formatDkNumber(
      p.totalCustomers,
    )} ${
      p.totalCustomers === 1 ? "kortholder" : "kortholdere"
    }, klar til det første stempel.`;
  }
  if (p.returningToday === 0) {
    return `${formatDkNumber(p.visitorsToday)} ${
      p.visitorsToday === 1 ? "ny kunde har" : "nye kunder har"
    } besøgt jer i dag.`;
  }
  return `${formatDkNumber(p.visitorsToday)} ${
    p.visitorsToday === 1 ? "kunde har" : "kunder har"
  } besøgt jer i dag, ${formatDkNumber(p.returningToday)} af dem er kommet igen.`;
}

/** Hjem-linjen for en butik med kun Henvisninger (ingen stempler at taelle). */
export function referralSummaryLine(p: { totalCustomers: number; newThisMonth: number; waiting: number }): string {
  if (p.totalCustomers === 0) {
    return "Velkommen. Del linket til din henvisningsside, så kommer de første kunder.";
  }
  const n = formatDkNumber(p.newThisMonth);
  const base = `I har ${formatDkNumber(p.totalCustomers)} ${p.totalCustomers === 1 ? "kunde" : "kunder"}. ${n} ${
    p.newThisMonth === 1 ? "ny kunde" : "nye kunder"
  } via henvisninger denne måned.`;
  return p.waiting > 0 ? `${base} ${formatDkNumber(p.waiting)} venter på første besøg.` : base;
}
