import "server-only";

import type { AccentTheme, ThemeMode } from "@/constants/themes";
import { createClient } from "@/lib/supabase/server";

export type AppUserSettings = {
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
  privacyModeEnabled: boolean;
};

const defaultSettings: AppUserSettings = {
  themeMode: "system",
  accentTheme: "emerald",
  privacyModeEnabled: false,
};

export async function getAppUserSettings(): Promise<AppUserSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("theme_mode,accent_theme,privacy_mode_enabled")
    .maybeSingle();

  if (error || !data) {
    return defaultSettings;
  }

  return {
    themeMode: data.theme_mode as ThemeMode,
    accentTheme: data.accent_theme as AccentTheme,
    privacyModeEnabled: Boolean(data.privacy_mode_enabled),
  };
}
