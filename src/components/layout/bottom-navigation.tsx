"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon, type IconName } from "@/components/ui/icons";

const items: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/accounts", label: "Accounts", icon: "accounts" },
  { href: "/cashflow", label: "Cashflow", icon: "cashflow" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/portfolio", label: "Portfolio", icon: "portfolio" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function NavPendingHint() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={`absolute right-2 top-2 size-1.5 rounded-full bg-current transition-opacity ${
        pending ? "opacity-80" : "opacity-0"
      }`}
    />
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      for (const item of items) {
        if (item.href !== pathname) {
          router.prefetch(item.href);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [pathname, router]);

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] border-t border-border bg-surface/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_var(--overlay)] backdrop-blur-xl sm:bottom-6 sm:rounded-b-[2rem]"
    >
      <ul className="grid grid-cols-6">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                aria-current={isActive ? "page" : undefined}
                onPointerEnter={() => router.prefetch(item.href)}
                onPointerDown={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 text-[0.6rem] font-semibold transition-colors ${
                  isActive
                    ? "bg-accent-soft text-accent-strong"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <NavPendingHint />
                <Icon name={item.icon} className="size-[1.2rem]" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
