import type { Metadata } from "next";
import { ChatView } from "@/components/chat/chat-view";
import { getChatOptions } from "@/lib/chat/data";

export const metadata: Metadata = {
  title: "Chat",
};

export default async function ChatPage() {
  const { accounts, categories, setupError } = await getChatOptions();

  return (
    <ChatView
      accounts={accounts}
      categories={categories}
      setupError={setupError}
    />
  );
}
