// CSV-celle med formel-injektions-vaern. Excel/Sheets udfoerer et felt som en
// formel, hvis vaerdien starter med =, +, - eller @ (ogsaa selvom feltet er
// quotet). Da eksporterne indeholder frit brugerinput (fx butiksnavn), kunne et
// navn som =HYPERLINK(...) eller en DDE-payload udfoeres hos den, der aabner
// filen. Vi neutraliserer ved at foranstille ' foran saadanne felter (OWASP-
// anbefalingen). Tal roeres ikke, saa de stadig laeses som tal.
export function csvCell(
  v: string | number | null | undefined,
  opts?: { alwaysQuote?: boolean },
): string {
  if (typeof v === "number") return opts?.alwaysQuote ? `"${v}"` : String(v);
  let s = v == null ? "" : String(v);
  // TAB (\t) og CR (\r) kan ogsaa indlede en formel/kommando i nogle regneark.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  const escaped = s.replace(/"/g, '""');
  if (opts?.alwaysQuote || /[",\n\r]/.test(s)) return `"${escaped}"`;
  return s;
}
