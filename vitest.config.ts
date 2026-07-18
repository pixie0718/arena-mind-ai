import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "server-only": resolve(__dirname, "./vitest.server-only-shim.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Scoped to the deterministic decision-making engine (agents, tools,
      // orchestrator, intent classification, grounding) — the part of the
      // app "Logical decision making based on user context" actually
      // means, and the part a unit test can meaningfully assert on. UI
      // components are verified live (see GENAI-INTEGRATION-REPORT.md and
      // RC1-RELEASE-REPORT.md) rather than snapshot-tested, since what
      // matters for them (does it render correctly, is it accessible, does
      // it look right in both themes) isn't something a DOM-diff catches.
      include: ["src/ai/**/*.ts", "src/tools/**/*.ts"],
      exclude: ["src/ai/**/*.test.ts", "src/ai/prompts/**"],
      reporter: ["text", "html", "text-summary"],
    },
  },
});
