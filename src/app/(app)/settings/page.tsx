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
      href: "/settings/budgets",
      title: "Budget",
      description: "Atur batas pengeluaran bulanan.",
    },
    {
      href: "/settings/appearance",
      title: "Appearance",
      description: "Pilih mode tampilan dan warna tema.",
    },
    {
      href: "/settings/privacy",
      title: "Privacy & Security",
      description: "Sembunyikan nominal saat berada di tempat umum.",
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
      <LogoutButton />
    </>
  );
}
