"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveChatTransaction } from "@/app/(app)/chat/actions";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TemplateChips } from "@/components/chat/template-chips";
import { TransactionPreview } from "@/components/chat/transaction-preview";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { parseChatTransactions } from "@/lib/chat/parser";
import type {
  ChatAccount,
  ChatAsset,
  ChatCategory,
  ChatLiability,
  ChatMessage,
  ChatParseBatchFailure,
  ChatParseFailureReason,
  ChatParsedDraft,
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
  negative_admin_fee: "Biaya admin tidak boleh negatif ya.",
  admin_fee_too_large: "Biaya admin terlalu besar. Coba periksa lagi ya.",
  admin_fee_exceeds_amount:
    "Biaya admin tidak boleh lebih besar dari nominal jual.",
  admin_fee_not_supported:
    "Biaya admin hanya didukung untuk transfer, investasi, dan bayar hutang.",
  unknown_category:
    "Aku belum kenal kategori ini. Coba pilih template atau isi manual ya.",
  account_not_found:
    "Aku belum menemukan akun aktif. Tambahkan akun dulu atau isi manual ya.",
  asset_not_found:
    "Aku belum menemukan aset investasi itu. Tambahkan aset di Portfolio dulu ya.",
  liability_not_found:
    "Aku belum menemukan hutang itu. Tambahkan liability di Portfolio dulu ya.",
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
  assets,
  liabilities,
  categories,
  setupError,
}: {
  accounts: ChatAccount[];
  assets: ChatAsset[];
  liabilities: ChatLiability[];
  categories: ChatCategory[];
  setupError: string | null;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [previewQueue, setPreviewQueue] = useState<ChatParsedDraft[]>([]);
  const [previewBatchTotal, setPreviewBatchTotal] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const activePreview = previewQueue[0] ?? null;
  const preview = activePreview?.draft ?? null;
  const activePreviewIndex = previewBatchTotal
    ? previewBatchTotal - previewQueue.length + 1
    : 1;

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, preview, isParsing]);

  function selectTemplate(value: string) {
    setInput(value);
    setSuggestions([]);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function selectSuggestion(value: string) {
    setInput(value);
    setSuggestions([]);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function updateActivePreview(draft: ChatTransactionDraft) {
    setPreviewQueue((current) =>
      current.map((item, index) =>
        index === 0 ? { ...item, draft } : item,
      ),
    );
  }

  function uniqueSuggestions(failures: ChatParseBatchFailure[]) {
    return Array.from(
      new Set(failures.flatMap((failure) => failure.suggestions)),
    ).slice(0, 4);
  }

  function batchFailureMessage(failures: ChatParseBatchFailure[]) {
    const firstFailure = failures[0];

    if (!firstFailure) {
      return "Aku belum paham transaksi ini 🤔";
    }

    if (failures.length === 1) {
      return failureMessages[firstFailure.reason];
    }

    const samples = failures
      .slice(0, 2)
      .map((failure) => `"${failure.sourceText}"`)
      .join(", ");

    return `${failures.length} baris belum terbaca: ${samples}. Coba periksa formatnya ya.`;
  }

  function submitInput() {
    const rawText = input.trim();

    if (!rawText || isParsing || activePreview || setupError) {
      return;
    }

    setMessages((current) => [...current, message("user", rawText)]);
    setSuggestions([]);
    setIsParsing(true);

    window.setTimeout(() => {
      const result = parseChatTransactions(
        rawText,
        categories,
        accounts,
        assets,
        liabilities,
      );
      setIsParsing(false);

      if (result.drafts.length > 0) {
        setPreviewQueue(result.drafts);
        setPreviewBatchTotal(result.drafts.length);
        setPreviewError(null);
        setSuggestions(uniqueSuggestions(result.failures));
        setInput("");

        if (result.failures.length > 0) {
          setMessages((current) => [
            ...current,
            message(
              "assistant",
              `${result.drafts.length} transaksi siap direview. ${batchFailureMessage(
                result.failures,
              )}`,
              "error",
            ),
          ]);
        }

        return;
      }

      setMessages((current) => [
        ...current,
        message("assistant", batchFailureMessage(result.failures), "error"),
      ]);
      setSuggestions(uniqueSuggestions(result.failures));
      setInput("");
      inputRef.current?.focus();
    }, 250);
  }

  function cancelPreview() {
    if (previewQueue.length <= 1) {
      setPreviewBatchTotal(0);
    }

    setPreviewQueue((current) => current.slice(1));
    setPreviewError(null);
    setSuggestions([]);
    setInput("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function savePreview() {
    if (!activePreview) {
      return;
    }

    setPreviewError(null);
    startSaving(async () => {
      const result = await saveChatTransaction(activePreview.draft);

      if (!result.success) {
        setPreviewError(result.error ?? "Transaksi belum berhasil disimpan.");
        return;
      }

      const hasNextPreview = previewQueue.length > 1;
      setMessages((current) => [
        ...current,
        message(
          "assistant",
          hasNextPreview
            ? `${result.message ?? "Oke, transaksi sudah dicatat ✓"} Preview berikutnya siap.`
            : (result.message ?? "Oke, transaksi sudah dicatat ✓"),
          "success",
        ),
      ]);
      if (!hasNextPreview) {
        setPreviewBatchTotal(0);
      }

      setPreviewQueue((current) => current.slice(1));
      setSuggestions([]);
      setInput("");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  return (
    <div className="-mb-8 flex h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top))-4.75rem-max(0.75rem,env(safe-area-inset-bottom)))] min-h-0 flex-col sm:h-[calc(100dvh-9.25rem-max(0.75rem,env(safe-area-inset-bottom)))]">
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
                  Atau ketuk template di bawah.
                </p>
              </div>
            </div>
          )}

          {messages.map((chatMessage) => (
            <MessageBubble key={chatMessage.id} message={chatMessage} />
          ))}
          {suggestions.length > 0 && !preview && (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-card border border-border bg-surface p-4 shadow-card">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Coba format ini
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="rounded-full border border-accent/30 bg-accent-soft px-3 py-2 text-xs font-bold text-accent-strong transition active:scale-[0.96]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isParsing && <TypingIndicator />}
          {preview && (
            <TransactionPreview
              draft={preview}
              accounts={accounts}
              assets={assets}
              liabilities={liabilities}
              categories={categories}
              isSaving={isSaving}
              error={previewError}
              title={
                previewBatchTotal > 1
                  ? `Preview ${activePreviewIndex} dari ${previewBatchTotal}`
                  : "Preview Transaksi"
              }
              subtitle={
                activePreview
                  ? `Dari input: "${activePreview.sourceText}"`
                  : undefined
              }
              cancelLabel={previewQueue.length > 1 ? "Lewati" : "Batal"}
              saveLabel={previewQueue.length > 1 ? "Simpan & lanjut" : "Simpan ✓"}
              onChange={updateActivePreview}
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
