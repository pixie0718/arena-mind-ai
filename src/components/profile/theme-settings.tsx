"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Both themes ("Stadium Night" dark and a full light palette) are already
 * defined in globals.css — this is the first UI that actually lets a
 * visitor switch between them (the app previously forced dark via
 * `forcedTheme` in `app-providers.tsx`).
 *
 * Uses a dedicated sun/moon icon button rather than the generic on/off
 * switch pattern (see `AccessibilitySettings`) — a theme switcher toggles
 * between two distinct, nameable states (not an on/off preference), so an
 * icon that directly shows the current mode reads more clearly than a
 * pill switch here.
 *
 * `next-themes` doesn't know the real theme until after hydration (it
 * reads `localStorage`/the class already applied by its inline script), so
 * `resolvedTheme` is undefined on the first client render. Rendering a
 * neutral, non-interactive placeholder until `mounted` avoids a
 * server/client markup mismatch without needing to guess the theme.
 */
export function ThemeSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDark ? (
            <Moon className="size-4 text-secondary" aria-hidden="true" />
          ) : (
            <Sun className="size-4 text-secondary" aria-hidden="true" />
          )}
          Appearance
        </CardTitle>
        <CardDescription>Switch between Stadium Night and light mode.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Dark mode</span>
            <span className="text-xs text-muted-foreground">
              {isDark ? "Stadium Night is on." : "Light mode is on."}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            disabled={!mounted}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="glow-secondary flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground transition-colors hover:bg-muted/70 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {isDark ? <Moon className="size-5" aria-hidden="true" /> : <Sun className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
