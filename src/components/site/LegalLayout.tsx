import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";

export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="pb-24 pt-32">
        <div className="mx-auto w-full max-w-[760px] px-6 md:px-8">
          <h1 className="font-[300] text-[2.2rem] leading-tight tracking-[0.01em] text-ink">
            {title}
          </h1>
          <p className="mt-3 text-[0.8rem] font-[200] uppercase tracking-[0.1em] text-slate">
            Senest opdateret {updated}
          </p>
          {intro ? (
            <p className="mt-6 max-w-xl text-[1rem] font-[200] leading-[1.8] text-stone">
              {intro}
            </p>
          ) : null}
          <div className="mt-12 flex flex-col gap-9">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-[400] text-[1.15rem] tracking-[0.01em] text-ink">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-[0.95rem] font-[200] leading-[1.8] text-stone">
        {children}
      </div>
    </section>
  );
}
