import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";

describe("TypingIndicator", () => {
  test("renders an accessible live status announcing the assistant is typing", () => {
    render(<TypingIndicator />);
    const status = screen.getByRole("status");
    expect(status).toHaveAccessibleName("Assistant is typing");
  });
});
