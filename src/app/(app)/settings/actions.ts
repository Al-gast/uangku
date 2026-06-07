"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  accentThemes,
  themeModes,
  type AccentTheme,
  type ThemeMode,
} from "@/constants/themes";
import { createClient } from "@/lib/supabase/server";

const validThemeModes = new Set<ThemeMode>(
  themeModes.map((mode) => mode.id),
);
const validAccentThemes = new Set<AccentTheme>(
  accentThemes.map((theme) => theme.id),
);

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  return { supabase, userId: String(userId) };
}

function revalidateSettings() {
  revalidatePath("/dashboard");
  revalidatePath("/cashflow");
  revalidatePath("/settings");
  revalidatePath("/settings/appearance");
  revalidatePath("/settings/privacy");
  revalidatePath("/settings/budgets");
  revalidatePath("/portfolio");
}

export async function updateAppearance(input: {
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
}) {
  if (
    !validThemeModes.has(input.themeMode) ||
    !validAccentThemes.has(input.accentTheme)
  ) {
    return { success: false, error: "Pilihan tampilan tidak valid." };
  }

  const { supabase, userId } = await getAuthenticatedContext();
  const { error } = await supabase
    .from("user_settings")
    .update({
      theme_mode: input.themeMode,
      accent_theme: input.accentTheme,
    })
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      error: "Tampilan belum berhasil disimpan.",
    };
  }

  revalidateSettings();
  return { success: true };
}

export async function updatePrivacyMode(enabled: boolean) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { error } = await supabase
    .from("user_settings")
    .update({ privacy_mode_enabled: enabled })
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      error: "Privacy Mode belum berhasil diperbarui.",
    };
  }

  revalidateSettings();
  return { success: true };
}
