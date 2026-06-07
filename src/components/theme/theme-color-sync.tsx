"use client";

import { useEffect } from "react";
import {
  getThemeColor,
  type AccentTheme,
  type ResolvedThemeMode,
  type ThemeMode,
} from "@/constants/themes";

const darkModeQuery = "(prefers-color-scheme: dark)";

function resolveThemeMode(
  themeMode: ThemeMode,
  prefersDark: boolean,
): ResolvedThemeMode {
  if (themeMode === "system") {
    return prefersDark ? "dark" : "light";
  }

  return themeMode;
}

export function updateDocumentThemeColor(
  themeMode: ThemeMode,
  accentTheme: AccentTheme,
) {
  const resolvedMode = resolveThemeMode(
    themeMode,
    window.matchMedia(darkModeQuery).matches,
  );
  const color = getThemeColor(accentTheme, resolvedMode);
  let themeColorMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );

  if (!themeColorMeta) {
    themeColorMeta = document.createElement("meta");
    themeColorMeta.name = "theme-color";
    document.head.append(themeColorMeta);
  }

  themeColorMeta.content = color;
}

export function ThemeColorSync({
  themeMode,
  accentTheme,
}: {
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
}) {
  useEffect(() => {
    const systemTheme = window.matchMedia(darkModeQuery);
    const syncThemeColor = () =>
      updateDocumentThemeColor(themeMode, accentTheme);

    syncThemeColor();

    if (themeMode !== "system") {
      return;
    }

    systemTheme.addEventListener("change", syncThemeColor);
    return () => systemTheme.removeEventListener("change", syncThemeColor);
  }, [accentTheme, themeMode]);

  return null;
}
