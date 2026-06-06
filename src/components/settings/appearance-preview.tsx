import { accentThemes, themeModes } from "@/constants/themes";

export function AppearancePreview() {
  return (
    <section className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-card">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Appearance</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Pilihan tampilan sudah disiapkan. Penyimpanan preferensi akan
          ditambahkan di fase berikutnya.
        </p>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">
          Mode
        </p>
        <div className="grid grid-cols-3 gap-2">
          {themeModes.map((mode) => (
            <div
              key={mode.id}
              className={`rounded-control border px-3 py-3 text-center text-sm font-semibold ${
                mode.id === "system"
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "bg-surface text-muted"
              }`}
            >
              {mode.label}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">
          Accent theme
        </p>
        <div className="grid grid-cols-2 gap-2">
          {accentThemes.map((theme) => (
            <div
              key={theme.id}
              className={`flex items-center gap-3 rounded-control border px-3 py-3 ${
                theme.id === "emerald"
                  ? "border-accent bg-accent-soft"
                  : "bg-surface"
              }`}
            >
              <span
                className="size-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-sm font-semibold">{theme.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
