"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icons";

const items: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/cashflow", label: "Cashflow", icon: "cashflow" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/portfolio", label: "Portfolio", icon: "portfolio" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] border-t border-border bg-surface/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_var(--overlay)] backdrop-blur-xl"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.65rem] font-semibold transition-colors ${
                  isActive
                    ? "bg-accent-soft text-accent-strong"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <Icon name={item.icon} className="size-[1.35rem]" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
