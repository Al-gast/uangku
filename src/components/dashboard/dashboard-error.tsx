export function DashboardError() {
  return (
    <section className="rounded-card border border-expense/30 bg-surface p-5 shadow-card">
      <h2 className="font-bold text-foreground">Data belum bisa dimuat</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Ada masalah saat mengambil data keuangan kamu. Coba refresh halaman
        ini.
      </p>
    </section>
  );
}
