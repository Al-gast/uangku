"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveChatTransaction } from "@/app/(app)/chat/actions";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TemplateChips } from "@/components/chat/template-chips";
import { TransactionPreview } from "@/components/chat/transaction-preview";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { parseChatTransaction } from "@/lib/chat/parser";
import type {
  ChatAccount,
  ChatCategory,
  ChatMessage,
  ChatParseFailureReason,
  ChatTransactionDraft,
} from "@/lib/chat/types";

const failureMessages: Record<ChatParseFailureReason, string> = {
  no_amount:
    'Sepertinya nominal belum ada. Coba tambahkan angka, contoh: "makan 25k"',
  amount_only:
    'Aku perlu tahu ini untuk apa. Coba tulis kategori + nominal, contoh: "kopi 18k"',
  zero_amount: "Nominal harus lebih dari 0 ya.",
  negative_amount: "Nominal tidak boleh negatif ya.",
  amount_too_large: "Nominal terlalu besar. Coba periksa lagi ya.",
  unknown_category:
    "Aku belum kenal kategori ini. Coba pilih template atau isi manual ya.",
  account_not_found:
    "Aku belum menemukan akun aktif. Tambahkan akun dulu atau isi manual ya.",
  transfer_accounts_missing:
    'Sebutkan akun asal dan tujuan, contoh: "transfer dari BCA ke GoPay 100rb"',
  same_transfer_account: "Akun asal dan tujuan transfer harus berbeda ya.",
  unsupported: "Hmm, aku belum paham transaksi ini 🤔",
};

function message(
  role: ChatMessage["role"],
  content: string,
  tone?: ChatMessage["tone"],
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    tone,
  };
}

export function ChatView({
  accounts,
  categories,
  setupError,
}: {
  accounts: ChatAccount[];
  categories: ChatCategory[];
  setupError: string | null;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [preview, setPreview] = useState<ChatTransactionDraft | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, preview, isParsing]);

  function selectTemplate(value: string) {
    setInput(value);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function submitInput() {
    const rawText = input.trim();

    if (!rawText || isParsing || preview || setupError) {
      return;
    }

    setMessages((current) => [...current, message("user", rawText)]);
    setIsParsing(true);

    window.setTimeout(() => {
      const result = parseChatTransaction(rawText, categories, accounts);
      setIsParsing(false);

      if (result.success) {
        setPreview(result.draft);
        setPreviewError(null);
        return;
      }

      setMessages((current) => [
        ...current,
        message("assistant", failureMessages[result.reason], "error"),
      ]);
      setInput("");
      inputRef.current?.focus();
    }, 250);
  }

  function cancelPreview() {
    setPreview(null);
    setPreviewError(null);
    setInput("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function savePreview() {
    if (!preview) {
      return;
    }

    setPreviewError(null);
    startSaving(async () => {
      const result = await saveChatTransaction(preview);

      if (!result.success) {
        setPreviewError(result.error ?? "Transaksi belum berhasil disimpan.");
        return;
      }

      setMessages((current) => [
        ...current,
        message(
          "assistant",
          result.message ?? "Oke, transaksi sudah dicatat ✓",
          "success",
        ),
      ]);
      setPreview(null);
      setInput("");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  return (
    <div className="-mb-8 flex h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top))-5rem-env(safe-area-inset-bottom))] min-h-0 flex-col sm:h-[calc(100dvh-8rem-env(safe-area-inset-bottom))]">
      <header className="shrink-0 pb-3">
        <h1 className="text-xl font-extrabold tracking-tight">Chat</h1>
        <p className="mt-1 text-xs text-muted">Catat transaksi dengan cepat</p>
      </header>

      {setupError && (
        <p className="mb-3 shrink-0 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {setupError}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
        <div className="space-y-3">
          {messages.length === 0 && !preview && (
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-card border border-border bg-surface p-5 shadow-card">
                <div className="text-2xl">💬</div>
                <h2 className="mt-3 text-sm font-bold">
                  Halo! Kamu bisa catat transaksi di sini.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Ketik langsung, contoh{" "}
                  <code className="rounded bg-surface-muted px-2 py-0.5 text-xs font-semibold text-accent-strong">
                    makan 25k
                  </code>{" "}
                  atau{" "}
                  <code className="rounded bg-surface-muted px-2 py-0.5 text-xs font-semibold text-accent-strong">
                    gaji 4.7jt
                  </code>
                  .
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Atau pilih template di bawah untuk mulai.
                </p>
              </div>
            </div>
          )}

          {messages.map((chatMessage) => (
            <MessageBubble key={chatMessage.id} message={chatMessage} />
          ))}
          {isParsing && <TypingIndicator />}
          {preview && (
            <TransactionPreview
              draft={preview}
              accounts={accounts}
              categories={categories}
              isSaving={isSaving}
              error={previewError}
              onChange={setPreview}
              onCancel={cancelPreview}
              onSave={savePreview}
            />
          )}
          <div ref={contentEndRef} />
        </div>
      </div>

      <div className="shrink-0 bg-background">
        <TemplateChips onSelect={selectTemplate} />
        <ChatInputBar
          inputRef={inputRef}
          value={input}
          disabled={Boolean(setupError) || isParsing || Boolean(preview)}
          onChange={setInput}
          onSubmit={submitInput}
        />
      </div>
    </div>
  );
}
