"use client";

import { useEffect, useRef } from "react";
import type { ChatUIMessage } from "@/store/chat";
import type { ChatStatus } from "@/features/chat/hooks/use-arena-chat";
import { ChatMessageBubble } from "@/features/chat/components/chat-message-bubble";
import { ChatEmptyState } from "@/features/chat/components/chat-empty-state";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";

interface ChatMessageListProps {
  messages: ChatUIMessage[];
  status: ChatStatus;
  onSuggestedAction: (prompt: string) => void;
  onSelectQuickAction: (prompt: string) => void;
}

const NEAR_BOTTOM_THRESHOLD_PX = 80;

export function ChatMessageList({
  messages,
  status,
  onSuggestedAction,
  onSelectQuickAction,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
  }

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, status]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <ChatEmptyState onSelectPrompt={onSelectQuickAction} />
      </div>
    );
  }

  const lastAssistantIndex = [...messages]
    .map((m, i) => ({ m, i }))
    .reverse()
    .find(({ m }) => m.role === "assistant")?.i;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
    >
      {messages.map((message, index) => (
        <ChatMessageBubble
          key={message.id}
          message={message}
          isLatest={index === lastAssistantIndex}
          onSuggestedAction={onSuggestedAction}
          suggestedActionsDisabled={status === "submitting" || status === "streaming"}
        />
      ))}
      {status === "submitting" && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
