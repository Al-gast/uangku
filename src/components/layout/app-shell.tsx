import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PrivacyProvider } from "@/components/providers/privacy-provider";
import type { AccentTheme, ThemeMode } from "@/constants/themes";

type AppShellProps = {
  children: ReactNode;
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
  privacyModeEnabled: boolean;
};

export function AppShell({
  children,
  themeMode,
  accentTheme,
  privacyModeEnabled,
}: AppShellProps) {
  return (
    <PrivacyProvider initialEnabled={privacyModeEnabled}>
      <div
        data-app-theme
        data-mode={themeMode}
        data-accent={accentTheme}
        className="min-h-dvh bg-background text-foreground sm:px-4 sm:py-6"
      >
        <div className="mx-auto min-h-dvh max-w-[480px] bg-background sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-border sm:shadow-card">
          <main className="px-5 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
            {children}
          </main>
          <BottomNavigation />
        </div>
      </div>
    </PrivacyProvider>
  );
}
