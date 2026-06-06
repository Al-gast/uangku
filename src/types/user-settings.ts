import type { AccentTheme, ThemeMode } from "@/constants/themes";

export type PinLockBehavior =
  | "on_app_open"
  | "after_5_minutes"
  | "sensitive_pages_only"
  | "disabled";

export type UserSettings = {
  id: string;
  user_id: string;
  theme_mode: ThemeMode;
  accent_theme: AccentTheme;
  privacy_mode_enabled: boolean;
  pin_lock_enabled: boolean;
  pin_lock_behavior: PinLockBehavior;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};
