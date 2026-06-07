"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePrivacyMode } from "@/app/(app)/settings/actions";
import { usePrivacy } from "@/components/providers/privacy-provider";

export function PrivacyToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const { privacyEnabled, setPrivacyEnabled } = usePrivacy();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !privacyEnabled;
    setPrivacyEnabled(next);
    setError(null);

    startTransition(async () => {
      const result = await updatePrivacyMode(next);

      if (!result.success) {
        setPrivacyEnabled(!next);
        setError(result.error ?? "Privacy Mode belum berhasil diperbarui.");
        return;
      }

      router.refresh();
    });
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={
          privacyEnabled ? "Tampilkan nominal" : "Sembunyikan nominal"
        }
        title={privacyEnabled ? "Tampilkan nominal" : "Sembunyikan nominal"}
        className="grid size-11 place-items-center rounded-2xl border border-border bg-surface text-lg shadow-card transition active:scale-[0.96] disabled:opacity-60"
      >
        {privacyEnabled ? "🙈" : "👁"}
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={privacyEnabled}
        disabled={pending}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 rounded-card border border-border bg-surface p-5 text-left shadow-card transition active:scale-[0.99] disabled:opacity-60"
      >
        <span>
          <span className="block font-bold">Privacy Mode</span>
          <span className="mt-1 block text-sm leading-6 text-muted">
            Sembunyikan nominal saat di tempat umum.
          </span>
        </span>
        <span
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            privacyEnabled ? "bg-accent" : "bg-surface-muted"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${
              privacyEnabled ? "left-6" : "left-1"
            }`}
          />
        </span>
      </button>
      {error && <p className="mt-3 text-sm text-expense">{error}</p>}
    </div>
  );
}
