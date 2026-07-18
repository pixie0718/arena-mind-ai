"use client";

import * as React from "react";
import { useAtom } from "jotai";
import { sessionIdAtom } from "@/store/session";
import { generateId } from "@/utils/id";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom);

  React.useEffect(() => {
    if (!sessionId) {
      setSessionId(generateId("session"));
    }
  }, [sessionId, setSessionId]);

  return <>{children}</>;
}
