import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/page-intro";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export const metadata: Metadata = {
  title: "Portfolio",
};

export default function PortfolioPage() {
  return (
    <>
      <PageIntro
        eyebrow="Kekayaan"
        title="Portfolio"
        description="Pantau aset, liability, alokasi, dan perkembangan net worth kamu."
      />
      <PlaceholderCard
        icon="portfolio"
        title="Portfolio masih kosong"
        description="Pencatatan aset dan perhitungan net worth akan ditambahkan pada fase portfolio, tanpa data contoh palsu."
      />
    </>
  );
}
