import "server-only";

import { cache } from "react";
import type { AccentTheme, ThemeMode } from "@/constants/themes";
import { createClient } from "@/lib/supabase/server";

export type AppUserSettings = {
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
  privacyModeEnabled: boolean;
  onboardingCompleted: boolean;
};

const defaultSettings: AppUserSettings = {
  themeMode: "system",
  accentTheme: "emerald",
  privacyModeEnabled: false,
  onboardingCompleted: false,
};

export const getAppUserSettings = cache(async (): Promise<AppUserSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "theme_mode,accent_theme,privacy_mode_enabled,onboarding_completed",
    )
    .maybeSingle();

  if (error || !data) {
    return defaultSettings;
  }

  return {
    themeMode: data.theme_mode as ThemeMode,
    accentTheme: data.accent_theme as AccentTheme,
    privacyModeEnabled: Boolean(data.privacy_mode_enabled),
    onboardingCompleted: Boolean(data.onboarding_completed),
  };
});
