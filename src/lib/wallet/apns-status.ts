// Klassificér et APNs-svar, saa vi handler rigtigt paa hver slags. Ren funktion
// (ingen I/O), saa den kan enhedstestes uden Apple-certifikater eller database.
//
// - "dead": doedt push-token, 410 Unregistered / 400 BadDeviceToken (enheden har
//   fjernet passet). Forventet -> ryd registreringen op.
// - "transient": APNs er overbelastet (429) eller nede (5xx). Ikke vores fejl, og
//   passet selv-healer naar Wallet henter igen. Log lokalt, men spam IKKE Sentry
//   (et udfald ville ellers kunne braende hele free-tier-kvoten paa faa minutter
//   og skjule det egentlige signal).
// - "config": andet ikke-2xx (fx 403 forkert token/cert). Rammer ALLE pushes og
//   er en fejl hos os -> rapportér straks.
// - "ok": 200, eller ingen/ukendt status (null) -> ingen handling.
export type ApnsOutcome = "dead" | "transient" | "config" | "ok";

export function classifyApnsStatus(status: number | null): ApnsOutcome {
  if (status === 410 || status === 400) return "dead";
  if (status === 429 || (status !== null && status >= 500)) return "transient";
  if (status !== null && status !== 200) return "config";
  return "ok";
}
