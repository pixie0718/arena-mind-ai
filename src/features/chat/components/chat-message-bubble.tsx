"use client";

import { motion } from "framer-motion";
import { Goal } from "lucide-react";
import type { ChatUIMessage } from "@/store/chat";
import { cn } from "@/lib/utils";
import { formatMessageText } from "@/features/chat/utils/format-message-text";
import { ToolResultCard } from "@/features/chat/components/tool-result-card";
import { SuggestedActionChips } from "@/features/chat/components/suggested-action-chips";
import { NavigationMapCard } from "@/features/navigation";
import { isNavigationMetadata } from "@/features/navigation/utils/is-navigation-metadata";
import { EmergencyCard } from "@/features/emergency";
import { isEmergencyMetadata } from "@/features/emergency/utils/is-emergency-metadata";

interface ChatMessageBubbleProps {
  message: ChatUIMessage;
  isLatest: boolean;
  onSuggestedAction: (prompt: string) => void;
  suggestedActionsDisabled?: boolean;
}

export function ChatMessageBubble({
  message,
  isLatest,
  onSuggestedAction,
  suggestedActionsDisabled,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const segments = formatMessageText(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-1.5"
    >
      <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
        {!isUser && (
          <span
            className="glow-secondary flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary"
            aria-hidden="true"
          >
            <Goal className="size-3.5" />
          </span>
        )}
        <div
          className={cn(
            "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed font-medium",
            isUser
              ? "glow-primary rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm border border-white/10 border-l-2 border-l-secondary/60 bg-card/70 text-card-foreground backdrop-blur-xl",
          )}
        >
          {segments.map((segment, index) =>
            segment.type === "bold" ? (
              <strong key={index} className="font-semibold">
                {segment.value}
              </strong>
            ) : (
              <span key={index}>{segment.value}</span>
            ),
          )}
          {message.isStreaming && (
            <motion.span
              aria-hidden="true"
              className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 rounded-sm bg-secondary align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      </div>

      {!isUser &&
        !message.isStreaming &&
        (isEmergencyMetadata(message.metadata) ? (
          <EmergencyCard metadata={message.metadata} onSuggestedAction={onSuggestedAction} />
        ) : isNavigationMetadata(message.metadata) ? (
          <NavigationMapCard metadata={message.metadata} onSuggestedAction={onSuggestedAction} />
        ) : (
          <ToolResultCard toolCalls={message.toolCalls} />
        ))}

      {!isUser && isLatest && !message.isStreaming && (
        <SuggestedActionChips
          actions={message.ui?.suggestedActions}
          onSelect={onSuggestedAction}
          disabled={suggestedActionsDisabled}
        />
      )}
    </motion.div>
  );
}
