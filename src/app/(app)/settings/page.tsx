import type { Metadata } from "next";
import Link from "next/link";
import { AppearancePreview } from "@/components/settings/appearance-preview";
import { LogoutButton } from "@/components/settings/logout-button";
import { PageIntro } from "@/components/ui/page-intro";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Preferensi"
        title="Settings"
        description="Atur tampilan dan, di fase berikutnya, preferensi akun serta privasi UangKu."
      />
      <Link
        href="/settings/budgets"
        className="mb-4 flex items-center justify-between rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-accent/50 active:scale-[0.99]"
      >
        <span>
          <span className="block font-bold">Budget</span>
          <span className="mt-1 block text-sm text-muted">
            Atur batas pengeluaran bulanan.
          </span>
        </span>
        <Icon name="arrow" className="size-5 text-muted" />
      </Link>
      <AppearancePreview />
      <LogoutButton />
    </>
  );
}
