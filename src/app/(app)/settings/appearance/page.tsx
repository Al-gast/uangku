import type { Metadata } from "next";
import Link from "next/link";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { getAppUserSettings } from "@/lib/settings/data";

export const metadata: Metadata = {
  title: "Appearance",
};

export default async function AppearancePage() {
  const settings = await getAppUserSettings();

  return (
    <>
      <Link
        href="/settings"
        className="mb-5 inline-flex text-sm font-bold text-muted"
      >
        ← Settings
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Personalisasi
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Appearance
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sesuaikan mode tampilan dan warna tema UangKu.
        </p>
      </header>
      <AppearanceSettings
        initialThemeMode={settings.themeMode}
        initialAccentTheme={settings.accentTheme}
      />
    </>
  );
}
