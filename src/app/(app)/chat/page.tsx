import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/page-intro";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export const metadata: Metadata = {
  title: "Chat",
};

export default function ChatPage() {
  return (
    <>
      <PageIntro
        eyebrow="Input cepat"
        title="Chat"
        description="Nanti kamu bisa mencatat transaksi dengan bahasa sehari-hari dan memeriksanya sebelum disimpan."
      />
      <PlaceholderCard
        icon="chat"
        title="Chat input belum aktif"
        description="Template chips, parser sederhana, dan transaction preview tetap menunggu fase cashflow stabil."
      />
    </>
  );
}
