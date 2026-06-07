"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  let themeColorMetas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  let themeColorMeta = themeColorMetas[0];

  if (!themeColorMeta) {
    themeColorMeta = document.createElement("meta");
    themeColorMeta.name = "theme-color";
    document.head.append(themeColorMeta);
    themeColorMetas = document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
  }

  themeColorMetas.forEach((meta, index) => {
    meta.content = color;
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
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    const systemTheme = window.matchMedia(darkModeQuery);
    const syncThemeColor = () =>
      updateDocumentThemeColor(themeMode, accentTheme);
    let frameId = 0;
    let timeoutId = 0;
    let delayedTimeoutId = 0;

    const scheduleSync = () => {
      syncThemeColor();
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(delayedTimeoutId);
      frameId = requestAnimationFrame(syncThemeColor);
      timeoutId = window.setTimeout(syncThemeColor, 0);
      delayedTimeoutId = window.setTimeout(syncThemeColor, 75);
    };

    scheduleSync();

    if (themeMode !== "system") {
      return () => {
        cancelAnimationFrame(frameId);
        window.clearTimeout(timeoutId);
        window.clearTimeout(delayedTimeoutId);
      };
    }

    systemTheme.addEventListener("change", scheduleSync);
    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(delayedTimeoutId);
      systemTheme.removeEventListener("change", scheduleSync);
    };
  }, [accentTheme, pathname, search, themeMode]);

  return null;
}
