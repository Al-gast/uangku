import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getAppUserSettings } from "@/lib/settings/data";

export default async function MainAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const appSettings = await getAppUserSettings();

  if (!appSettings.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      themeMode={appSettings.themeMode}
      accentTheme={appSettings.accentTheme}
      privacyModeEnabled={appSettings.privacyModeEnabled}
    >
      {children}
    </AppShell>
  );
}
