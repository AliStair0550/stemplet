// Firmaoplysninger til jura-siderne (handelsbetingelser, privatliv,
// databehandleraftale). EEN kilde, saa CVR og adresse kun skal indsaettes eet
// sted og saa staar ens paa alle tre sider.
//
// TODO (Ali): udfyld `cvr` og `address`, og saet `legalName`, naar selskabet er besluttet.
// Saa snart de er udfyldt, vises de automatisk paa alle jura-sider. Tomme felter
// vises IKKE, saa siderne aldrig staar med blanke rubrikker. Husk at bumpe
// "Senest opdateret"-datoen paa de tre sider, naar de rigtige tal er inde.
export const COMPANY = {
  // Juridisk navn og selskabsform er ikke besluttet endnu (Ali); indtil da
  // bruges blot "Folka".
  legalName: "Folka",
  cvr: "", // fx "12345678"
  address: "", // fx "Gadenavn 1, 1234 By"
  contactEmail: "hej@folka.dk",
} as const;
