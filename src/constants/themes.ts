export const themeModes = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
] as const;

export const accentThemes = [
  {
    id: "emerald",
    label: "Emerald",
    color: "#15966a",
    darkColor: "#0f7654",
  },
  {
    id: "blue",
    label: "Blue",
    color: "#3276d2",
    darkColor: "#245ca8",
  },
  {
    id: "purple",
    label: "Purple",
    color: "#7658d1",
    darkColor: "#5b3fb0",
  },
  {
    id: "orange",
    label: "Orange",
    color: "#df6e35",
    darkColor: "#b85225",
  },
  {
    id: "mono",
    label: "Mono",
    color: "#3f4743",
    darkColor: "#252b28",
  },
] as const;

export type ThemeMode = (typeof themeModes)[number]["id"];
export type AccentTheme = (typeof accentThemes)[number]["id"];
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;

export function getThemeColor(
  accentTheme: AccentTheme,
  resolvedMode: ResolvedThemeMode,
) {
  const theme =
    accentThemes.find(({ id }) => id === accentTheme) ?? accentThemes[0];

  return resolvedMode === "dark" ? theme.darkColor : theme.color;
}
