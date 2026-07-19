import { COMPANY } from "@/lib/company";

// Firmaoplysninger (navn, CVR, adresse) til jura-siderne. CVR og adresse vises
// KUN, naar de er udfyldt i COMPANY, saa siden aldrig staar med blanke felter,
// foer de rigtige tal er inde. Passer ind i LegalSection'ens tekst-stil.
export function LegalCompanyInfo() {
  const cvr = COMPANY.cvr.trim();
  const address = COMPANY.address.trim();
  if (!cvr && !address) return null;
  return (
    <p>
      <span className="font-[400] text-ink">{COMPANY.legalName}</span>
      {cvr ? (
        <>
          <br />
          CVR-nr.: {cvr}
        </>
      ) : null}
      {address ? (
        <>
          <br />
          {address}
        </>
      ) : null}
    </p>
  );
}
