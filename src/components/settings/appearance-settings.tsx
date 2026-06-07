"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAppearance } from "@/app/(app)/settings/actions";
import { updateDocumentThemeColor } from "@/components/theme/theme-color-sync";
import {
  accentThemes,
  themeModes,
  type AccentTheme,
  type ThemeMode,
} from "@/constants/themes";

export function AppearanceSettings({
  initialThemeMode,
  initialAccentTheme,
}: {
  initialThemeMode: ThemeMode;
  initialAccentTheme: AccentTheme;
}) {
  const router = useRouter();
  const [themeMode, setThemeMode] = useState(initialThemeMode);
  const [accentTheme, setAccentTheme] = useState(initialAccentTheme);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function applyTheme(mode: ThemeMode, accent: AccentTheme) {
    const themeRoot = document.querySelector<HTMLElement>("[data-app-theme]");
    themeRoot?.setAttribute("data-mode", mode);
    themeRoot?.setAttribute("data-accent", accent);
    updateDocumentThemeColor(mode, accent);
  }

  function save(mode: ThemeMode, accent: AccentTheme) {
    const previousMode = themeMode;
    const previousAccent = accentTheme;
    setThemeMode(mode);
    setAccentTheme(accent);
    setError(null);
    applyTheme(mode, accent);

    startTransition(async () => {
      const result = await updateAppearance({
        themeMode: mode,
        accentTheme: accent,
      });

      if (!result.success) {
        setThemeMode(previousMode);
        setAccentTheme(previousAccent);
        applyTheme(previousMode, previousAccent);
        setError(result.error ?? "Tampilan belum berhasil disimpan.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm text-expense">
          {error}
        </p>
      )}

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-bold">Mode Tampilan</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Pilih tampilan terang, gelap, atau mengikuti perangkat.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {themeModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={pending}
              onClick={() => save(mode.id, accentTheme)}
              className={`min-h-12 rounded-control border px-2 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${
                themeMode === mode.id
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border bg-background text-muted"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-bold">Warna Tema</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Warna ini digunakan untuk tombol, navigasi, dan aksen utama.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {accentThemes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              disabled={pending}
              onClick={() => save(themeMode, theme.id)}
              className={`flex min-h-12 items-center gap-3 rounded-control border px-3 text-left transition active:scale-[0.98] disabled:opacity-60 ${
                accentTheme === theme.id
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-background"
              }`}
            >
              <span
                className="size-5 rounded-full border-2 border-white/80 shadow-sm"
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-sm font-bold">{theme.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-accent/25 bg-accent-soft p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-accent-strong">
          Preview tema
        </p>
        <div className="mt-3 rounded-control bg-surface p-4 shadow-card">
          <p className="font-bold">UangKu</p>
          <p className="mt-1 text-sm text-muted">
            Tampilan preview menggunakan pilihan kamu.
          </p>
          <span className="mt-4 inline-flex min-h-10 items-center rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground">
            Tombol utama
          </span>
        </div>
      </section>
    </div>
  );
}
