"use client";

import { useState } from "react";
import { CHAT_TEMPLATE_GROUPS } from "@/constants/chat";

export function TemplateChips({
  onSelect,
}: {
  onSelect: (value: string) => void;
}) {
  const [activeGroupId, setActiveGroupId] = useState("primer");
  const activeGroup =
    CHAT_TEMPLATE_GROUPS.find((group) => group.id === activeGroupId) ??
    CHAT_TEMPLATE_GROUPS[0];

  return (
    <div className="space-y-2 border-t border-border bg-background py-2">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHAT_TEMPLATE_GROUPS.map((group) => {
          const isActive = group.id === activeGroup.id;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroupId(group.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.96] ${
                isActive
                  ? "border-accent/30 bg-accent-soft text-accent-strong"
                  : "border-border bg-surface text-muted"
              }`}
            >
              {group.icon} {group.label}
            </button>
          );
        })}
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeGroup.templates.map((template) => (
          <button
            key={template.label}
            type="button"
            disabled={template.disabled}
            title={template.disabled ? "Segera hadir" : undefined}
            onClick={() => onSelect(template.value)}
            className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {template.label}
            {template.disabled && (
              <span className="ml-1.5 text-[0.65rem] text-muted">
                Segera hadir
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
