"use client";

import { useCallback, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { toast } from "sonner";
import { chatMessagesAtom, type ChatUIMessage } from "@/store/chat";
import { sessionIdAtom, preferredLanguageAtom, stadiumIdAtom } from "@/store/session";
import { generateId } from "@/utils/id";
import { streamChatMessage, ChatServiceError } from "@/features/chat/services/chat.service";

export type ChatStatus = "idle" | "submitting" | "streaming" | "error";

export interface UseArenaChatReturn {
  messages: ChatUIMessage[];
  status: ChatStatus;
  errorMessage: string | null;
  sessionId: string | null;
  sendMessage: (text: string) => Promise<void>;
  retryLast: () => Promise<void>;
  clearConversation: () => void;
}

/**
 * Named `useArenaChat` rather than `useChat` to avoid any confusion with
 * the unused `@ai-sdk/react` export of the same name — this hook talks to
 * a custom NDJSON stream, not the Vercel AI SDK.
 */
export function useArenaChat(): UseArenaChatReturn {
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const sessionId = useAtomValue(sessionIdAtom);
  const preferredLanguage = useAtomValue(preferredLanguageAtom);
  const stadiumId = useAtomValue(stadiumIdAtom);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastUserTextRef = useRef<string | null>(null);

  const runRequest = useCallback(
    async (text: string) => {
      if (!sessionId) return;

      setStatus("submitting");
      setErrorMessage(null);
      lastUserTextRef.current = text;

      let assistantId: string | null = null;

      try {
        await streamChatMessage(
          { sessionId, text, language: preferredLanguage, stadiumId },
          {
            onChunk: (chunk) => {
              setStatus("streaming");
              setMessages((prev) => {
                if (assistantId === null) {
                  assistantId = generateId("msg");
                  return [
                    ...prev,
                    {
                      id: assistantId,
                      role: "assistant",
                      content: chunk,
                      createdAt: new Date().toISOString(),
                      isStreaming: true,
                    },
                  ];
                }
                return prev.map((message) =>
                  message.id === assistantId
                    ? { ...message, content: message.content + chunk }
                    : message,
                );
              });
            },
            onDone: (payload) => {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        isStreaming: false,
                        toolCalls: payload.toolCalls,
                        metadata: payload.metadata ?? undefined,
                        ui: {
                          agentId: payload.agentId,
                          suggestedActions: payload.suggestedActions,
                          requiresClarification: payload.requiresClarification,
                          clarificationPrompt: payload.clarificationPrompt,
                        },
                      }
                    : message,
                ),
              );
              setStatus("idle");
            },
          },
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        const message =
          error instanceof ChatServiceError || error instanceof Error
            ? error.message
            : "Something went wrong.";
        setStatus("error");
        setErrorMessage(message);
        toast.error(message);

        if (assistantId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m)),
          );
        }
      }
    },
    [sessionId, preferredLanguage, stadiumId, setMessages],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "submitting" || status === "streaming") return;

      setMessages((prev) => [
        ...prev,
        {
          id: generateId("msg"),
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);

      await runRequest(trimmed);
    },
    [status, runRequest, setMessages],
  );

  const retryLast = useCallback(async () => {
    if (lastUserTextRef.current) await runRequest(lastUserTextRef.current);
  }, [runRequest]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setErrorMessage(null);
  }, [setMessages]);

  return { messages, status, errorMessage, sessionId, sendMessage, retryLast, clearConversation };
}
