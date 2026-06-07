"use client";

import { usePathname } from "next/navigation";
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
  const themeColorMetas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  let themeColorMeta = themeColorMetas[0];

  if (!themeColorMeta) {
    themeColorMeta = document.createElement("meta");
    themeColorMeta.name = "theme-color";
    document.head.append(themeColorMeta);
  }

  themeColorMeta.content = color;
  themeColorMetas.forEach((meta, index) => {
    if (index > 0) {
      meta.remove();
    }
  });
}

export function ThemeColorSync({
  themeMode,
  accentTheme,
}: {
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const systemTheme = window.matchMedia(darkModeQuery);
    const syncThemeColor = () =>
      updateDocumentThemeColor(themeMode, accentTheme);
    const animationFrame = window.requestAnimationFrame(syncThemeColor);

    syncThemeColor();

    if (themeMode !== "system") {
      return () => window.cancelAnimationFrame(animationFrame);
    }

    systemTheme.addEventListener("change", syncThemeColor);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      systemTheme.removeEventListener("change", syncThemeColor);
    };
  }, [accentTheme, pathname, themeMode]);

  return null;
}
