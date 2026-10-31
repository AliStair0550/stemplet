// Hver side i dashboardet toner blidt ind, naar man skifter side, saa skiftet
// foeles roligt i stedet for et hop. Kort og uden bevaegelse for den, der har
// slaaet animationer fra (globals.css).
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
