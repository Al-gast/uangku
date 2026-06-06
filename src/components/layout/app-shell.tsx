import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background sm:px-4 sm:py-6">
      <div className="mx-auto min-h-dvh max-w-[480px] bg-background sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-border sm:shadow-card">
        <main className="px-5 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
