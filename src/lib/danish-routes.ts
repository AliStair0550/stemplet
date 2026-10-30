// Offentlige adresser med æ/ø/å/é og den ASCII-mappe i src/app, der viser dem.
// Next' dev-server finder ikke ruter med ikke-ASCII mappenavne (404 lokalt,
// selvom produktion virker), saa mapperne er ASCII, og next.config.ts omskriver
// de danske adresser hertil. Ny side med æ/ø/å i adressen: tilfoej den her.
export const DANISH_ROUTES: [pretty: string, folder: string][] = [
  ["/prøv", "/proev"],
  ["/stempelkort-til-frisører", "/stempelkort-til-frisoerer"],
  ["/stempelkort-til-caféer", "/stempelkort-til-cafeer"],
];

// Gamle danske adresser, der varigt sendes videre.
export const DANISH_REDIRECTS: [pretty: string, to: string][] = [["/stempelkort-til-ølbarer", "/stempelkort-til-barer"]];

/** Alle former, en browser kan sende stien i: som den er, procent-kodet, og NFD (é som e + accent). */
export function pathVariants(pretty: string): string[] {
  const nfd = pretty.normalize("NFD");
  return [...new Set([pretty, encodeURI(pretty), nfd, encodeURI(nfd)])];
}
