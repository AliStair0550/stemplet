// Skelet mens en dashboard-side server-renderes (Neon-rundtur). Vises straks
// ved navigation, saa siden foeles oejeblikkelig i stedet for et blankt vent.
// Ligger paa /app-niveau, saa alle dashboard-sider arver det.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-hidden>
      {/* Overskrift */}
      <div className="mb-8 flex flex-col gap-2.5">
        <div className="h-7 w-44 rounded bg-fog" />
        <div className="h-4 w-72 max-w-full rounded bg-fog/70" />
      </div>

      {/* Stat-felter */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-fog bg-white p-5">
            <div className="h-3 w-16 rounded bg-fog" />
            <div className="mt-3 h-8 w-20 rounded bg-fog" />
          </div>
        ))}
      </div>

      {/* Indholdsblok */}
      <div className="mt-8 rounded-lg border border-fog bg-white p-6">
        <div className="h-4 w-32 rounded bg-fog" />
        <div className="mt-5 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-fog/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
