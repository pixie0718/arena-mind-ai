"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FloatingFootballLayer } from "@/components/shared/floating-football-layer";
import { useArenaChat } from "@/features/chat/hooks/use-arena-chat";
import { ChatHeader } from "@/features/chat/components/chat-header";
import { ChatMessageList } from "@/features/chat/components/chat-message-list";
import { ChatComposer } from "@/features/chat/components/chat-composer";

export function ChatScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, status, errorMessage, sessionId, sendMessage, retryLast, clearConversation } =
    useArenaChat();
  const [draft, setDraft] = useState("");
  const hasAutoSentRef = useRef(false);

  useEffect(() => {
    const q = searchParams.get("q");
    // Wait for `sessionIdAtom` to be populated (SessionProvider's effect,
    // an ancestor, can still be pending on a brand-new browser since child
    // effects run before parent effects) before consuming `q` — otherwise
    // `sendMessage` would optimistically add the user's bubble and then
    // silently bail with no reply and no error.
    if (!q || hasAutoSentRef.current || !sessionId) return;
    hasAutoSentRef.current = true;
    void sendMessage(q);
    router.replace("/chat", { scroll: false });
  }, [searchParams, sessionId, sendMessage, router]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-2xl flex-col md:border-x md:border-white/10">
      <FloatingFootballLayer badgePosition="top" />
      <ChatHeader onClear={clearConversation} />
      <ChatMessageList
        messages={messages}
        status={status}
        onSuggestedAction={sendMessage}
        onSelectQuickAction={sendMessage}
      />
      {status === "error" && (
        <div className="flex items-center justify-between gap-3 border-t border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          <span>{errorMessage}</span>
          <Button size="sm" variant="destructive" onClick={() => void retryLast()}>
            Retry
          </Button>
        </div>
      )}
      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSubmit={() => {
          if (!draft.trim()) return;
          void sendMessage(draft);
          setDraft("");
        }}
        onQuickAction={(prompt) => void sendMessage(prompt)}
        status={status}
        showQuickActions={messages.length > 0}
      />
    </div>
  );
}
