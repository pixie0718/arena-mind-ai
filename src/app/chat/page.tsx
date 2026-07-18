import { Suspense } from "react";
import { ChatScreen } from "@/features/chat/components/chat-screen";
import { Skeleton } from "@/components/ui/skeleton";

function ChatScreenFallback() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-2xl flex-col gap-3 p-4 md:border-x md:border-white/10">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="flex-1 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatScreenFallback />}>
      <ChatScreen />
    </Suspense>
  );
}
