import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestedActionChips } from "@/features/chat/components/suggested-action-chips";

describe("SuggestedActionChips", () => {
  test("renders nothing when there are no actions", () => {
    const { container } = render(<SuggestedActionChips actions={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when actions is undefined", () => {
    const { container } = render(<SuggestedActionChips onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders a chip per action with its label", () => {
    render(
      <SuggestedActionChips
        actions={[
          { label: "Find nearest restroom", prompt: "Where is the nearest restroom?" },
          { label: "Find fastest exit", prompt: "What's the fastest exit?" },
        ]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Find nearest restroom")).toBeInTheDocument();
    expect(screen.getByText("Find fastest exit")).toBeInTheDocument();
  });

  test("clicking a chip calls onSelect with that action's real prompt, not its label", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <SuggestedActionChips
        actions={[{ label: "Find nearest restroom", prompt: "Where is the nearest restroom?" }]}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByText("Find nearest restroom"));
    expect(onSelect).toHaveBeenCalledWith("Where is the nearest restroom?");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("chips are disabled (and unclickable) when disabled is true", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <SuggestedActionChips
        actions={[{ label: "Find nearest restroom", prompt: "Where is the nearest restroom?" }]}
        onSelect={onSelect}
        disabled
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
