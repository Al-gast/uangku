import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getAppUserSettings } from "@/lib/settings/data";
import { createClient } from "@/lib/supabase/server";

export default async function MainAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const [{ data: settings, error }, appSettings] = await Promise.all([
    supabase
      .from("user_settings")
      .select("onboarding_completed")
      .maybeSingle(),
    getAppUserSettings(),
  ]);

  if (error || !settings?.onboarding_completed) {
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
