import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/page-intro";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export const metadata: Metadata = {
  title: "Cashflow",
};

export default function CashflowPage() {
  return (
    <>
      <PageIntro
        eyebrow="Transaksi"
        title="Cashflow"
        description="Lacak pemasukan, pengeluaran, dan transfer harian dalam satu tempat."
      />
      <PlaceholderCard
        icon="cashflow"
        title="Belum ada transaksi"
        description="Daftar transaksi dan form input singkat akan dibangun setelah account foundation dan onboarding selesai."
      />
    </>
  );
}
