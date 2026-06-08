import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/settings/logout-button";
import { PageIntro } from "@/components/ui/page-intro";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  const settingsItems = [
    {
      href: "/settings/accounts",
      title: "Akun",
      description: "Kelola tunai, rekening bank, dan e-wallet.",
    },
    {
      href: "/settings/budgets",
      title: "Budget",
      description: "Atur batas pengeluaran bulanan.",
    },
    {
      href: "/settings/categories",
      title: "Kategori",
      description: "Kelola kategori pemasukan dan pengeluaran.",
    },
    {
      href: "/insights",
      title: "Rekap & Insight",
      description: "Lihat ringkasan dan rekomendasi bulanan.",
    },
    {
      href: "/settings/appearance",
      title: "Tampilan",
      description: "Pilih mode tampilan dan warna tema.",
    },
    {
      href: "/settings/privacy",
      title: "Privasi",
      description: "Sembunyikan nominal saat di tempat umum.",
    },
    {
      href: "/settings/export",
      title: "Ekspor Data",
      description: "Download data UangKu untuk backup pribadi.",
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Preferensi"
        title="Settings"
        description="Atur budget, tampilan, dan privasi UangKu."
      />

      <div className="space-y-3">
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-accent/50 active:scale-[0.99]"
          >
            <span>
              <span className="block font-bold">{item.title}</span>
              <span className="mt-1 block text-sm text-muted">
                {item.description}
              </span>
            </span>
            <Icon name="arrow" className="size-5 text-muted" />
          </Link>
        ))}
      </div>
      <section className="mt-4 rounded-card border border-accent/25 bg-accent-soft p-5">
        <p className="text-sm font-bold text-accent-strong">
          Bisa dipasang ke layar utama.
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Buka menu browser → Tambah ke Layar Utama.
        </p>
      </section>
      <LogoutButton />
    </>
  );
}
