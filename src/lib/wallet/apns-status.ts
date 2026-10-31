// Klassificér et APNs-svar, saa vi handler rigtigt paa hver slags. Ren funktion
// (ingen I/O), saa den kan enhedstestes uden Apple-certifikater eller database.
//
// - "dead": doedt push-token, 410 Unregistered / 400 BadDeviceToken (enheden har
//   fjernet passet). Forventet -> ryd registreringen op. Kun disse to: et andet
//   400 (fx forkert topic efter en fejl i APPLE_PASS_TYPE_ID) er en fejl hos os
//   og maa ALDRIG slette registreringer, ellers opdaterer kortene aldrig igen.
// - "transient": APNs er overbelastet (429) eller nede (5xx). Ikke vores fejl, og
//   passet selv-healer naar Wallet henter igen. Log lokalt, men spam IKKE Sentry
//   (et udfald ville ellers kunne braende hele free-tier-kvoten paa faa minutter
//   og skjule det egentlige signal).
// - "config": andet ikke-2xx (fx 403 forkert token/cert). Rammer ALLE pushes og
//   er en fejl hos os -> rapportér straks.
// - "unknown": intet svar (tidsgraense eller afbrudt forbindelse). Vi ved ikke,
//   om pushet kom frem, saa det proeves igen som "transient" (B4). Wallet henter
//   ikke selv, saa et tabt push betyder et kort med det gamle tal.
// - "ok": 200.
export type ApnsOutcome = "dead" | "transient" | "config" | "unknown" | "ok";

export function classifyApnsStatus(
  status: number | null,
  reason?: string | null,
): ApnsOutcome {
  if (status === 410) return "dead";
  if (status === 400 && reason === "BadDeviceToken") return "dead";
  if (status === null) return "unknown";
  if (status === 429 || status >= 500) return "transient";
  if (status !== 200) return "config";
  return "ok";
}
