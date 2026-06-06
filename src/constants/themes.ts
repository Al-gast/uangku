export const themeModes = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
] as const;

export const accentThemes = [
  { id: "emerald", label: "Emerald", color: "#15966a" },
  { id: "blue", label: "Blue", color: "#3276d2" },
  { id: "purple", label: "Purple", color: "#7658d1" },
  { id: "orange", label: "Orange", color: "#df6e35" },
  { id: "mono", label: "Mono", color: "#3f4743" },
] as const;

export type ThemeMode = (typeof themeModes)[number]["id"];
export type AccentTheme = (typeof accentThemes)[number]["id"];
