import { describe, expect, test, vi } from "vitest";
import { createAbortTimeout } from "@/ai/abort-timeout";

describe("createAbortTimeout", () => {
  test("the signal is not aborted immediately", () => {
    const timeout = createAbortTimeout(1000);
    expect(timeout.signal.aborted).toBe(false);
    timeout.clear();
  });

  test("the signal aborts on its own once the timeout elapses", async () => {
    vi.useFakeTimers();
    const timeout = createAbortTimeout(50);
    expect(timeout.signal.aborted).toBe(false);
    vi.advanceTimersByTime(50);
    expect(timeout.signal.aborted).toBe(true);
    vi.useRealTimers();
  });

  test("clear() prevents the abort from ever firing", async () => {
    vi.useFakeTimers();
    const timeout = createAbortTimeout(50);
    timeout.clear();
    vi.advanceTimersByTime(100);
    expect(timeout.signal.aborted).toBe(false);
    vi.useRealTimers();
  });

  test("each call returns an independent controller", () => {
    const a = createAbortTimeout(1000);
    const b = createAbortTimeout(1000);
    a.clear();
    expect(a.signal.aborted).toBe(false);
    expect(b.signal.aborted).toBe(false);
    b.clear();
  });
});
