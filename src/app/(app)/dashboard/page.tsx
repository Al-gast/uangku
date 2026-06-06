import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/page-intro";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <PageIntro
        eyebrow="Ringkasan"
        title="Halo, selamat datang."
        description="Nanti semua kondisi keuangan penting kamu akan dirangkum dengan jelas di sini."
      />
      <div className="mb-4 rounded-card bg-accent p-6 text-accent-foreground shadow-lg">
        <p className="text-sm font-medium opacity-80">Sisa bulan ini</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">Belum ada data</p>
        <p className="mt-5 text-sm leading-6 opacity-80">
          Mulai dari onboarding dan pencatatan transaksi di fase berikutnya.
        </p>
      </div>
      <PlaceholderCard
        icon="dashboard"
        title="Dashboard kamu sedang disiapkan"
        description="Ringkasan income, expense, saving rate, budget, dan portfolio akan hadir setelah fondasi data tersedia."
        label="Foundation"
      />
    </>
  );
}
