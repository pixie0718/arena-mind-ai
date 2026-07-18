"use client";

import * as React from "react";
import { Provider as JotaiProvider } from "jotai";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { SessionProvider } from "@/providers/session-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SessionProvider>
          <TooltipProvider delay={200}>
            {children}
            <Toaster position="top-center" />
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
