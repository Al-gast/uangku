import Link from "next/link";
import type { ChatMessage } from "@/lib/chat/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role={message.tone === "error" ? "alert" : undefined}
    >
      <div
        className={`max-w-[88%] rounded-card px-4 py-3 text-sm leading-6 ${
          isUser
            ? "rounded-br-md bg-accent text-accent-foreground"
            : message.tone === "error"
              ? "border border-expense/20 bg-surface text-foreground shadow-card"
              : "border border-border bg-surface text-foreground shadow-card"
        }`}
      >
        <p>{message.content}</p>
        {message.tone === "error" && (
          <Link
            href="/cashflow/new"
            className="mt-3 inline-flex font-bold text-accent-strong"
          >
            Isi manual →
          </Link>
        )}
      </div>
    </div>
  );
}
