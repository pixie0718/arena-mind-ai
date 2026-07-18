import { describe, expect, test } from "vitest";
import { routeTool } from "@/tools/route.tool";
import type { Route } from "@/types/knowledge";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

describe("routeTool", () => {
  test("finds a route matching the destination by a substring of its 'to' field", async () => {
    const result = await routeTool.execute({ to: "Block B" }, ctx);
    expect(result.success).toBe(true);
    const data = result.data as Route;
    expect(data.to).toContain("Block B");
    expect(data.from).toBe("Gate A");
  });

  test("falls back to the stadium's first route for an unmatched destination, never fabricating one", async () => {
    const result = await routeTool.execute(
      { to: "a destination that does not exist anywhere" },
      ctx,
    );
    // findRoute's documented fallback: the stadium's first (and, in the
    // current demo data, only) route — never an invented one.
    expect(result.success).toBe(true);
    const data = result.data as Route;
    expect(data.id).toBe("route-001");
  });

  test("fails cleanly for a stadium with no route data at all", async () => {
    const result = await routeTool.execute(
      { to: "exit", stadiumId: "hardrock" },
      { ...ctx, stadiumId: "hardrock" },
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("No route found");
  });
});
