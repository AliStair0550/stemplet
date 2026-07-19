// Firmaoplysninger til jura-siderne (handelsbetingelser, privatliv,
// databehandleraftale). EEN kilde, saa CVR og adresse kun skal indsaettes eet
// sted og saa staar ens paa alle tre sider.
//
// TODO (Ali): udfyld `cvr` og `address` (og bekraeft `legalName` / selskabsform).
// Saa snart de er udfyldt, vises de automatisk paa alle jura-sider. Tomme felter
// vises IKKE, saa siderne aldrig staar med blanke rubrikker. Husk at bumpe
// "Senest opdateret"-datoen paa de tre sider, naar de rigtige tal er inde.
export const COMPANY = {
  legalName: "Alius", // evt. "Alius ApS" naar selskabsformen er bekraeftet
  cvr: "", // fx "12345678"
  address: "", // fx "Gadenavn 1, 1234 By"
  contactEmail: "hej@alius.dk",
} as const;

/** True naar der er mindst een offentlig firmaoplysning (CVR eller adresse) at vise. */
export function hasCompanyDetails(): boolean {
  return COMPANY.cvr.trim() !== "" || COMPANY.address.trim() !== "";
}
