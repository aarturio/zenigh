import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderWithChakra as render } from "../test-utils";
import TimeframeButtons from "../../src/components/charts/TimeframeButtons";

describe("TimeframeButtons", () => {
  it("should render all timeframe buttons", () => {
    render(<TimeframeButtons />);

    expect(screen.getByRole("button", { name: "1M" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5M" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1H" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1D" })).toBeInTheDocument();
  });

  it("should have 1H as default active timeframe", () => {
    render(<TimeframeButtons />);

    const hourButton = screen.getByRole("button", { name: "1H" });

    // 1H button should have active styling
    expect(hourButton).toHaveStyle({ background: "text.secondary" });
  });

  it("should call onTimeframeChange when button is clicked", async () => {
    const user = userEvent.setup();
    const onTimeframeChange = vi.fn();

    render(<TimeframeButtons onTimeframeChange={onTimeframeChange} />);

    const button = screen.getByRole("button", { name: "1M" });
    await user.click(button);

    expect(onTimeframeChange).toHaveBeenCalledTimes(1);
    expect(onTimeframeChange).toHaveBeenCalledWith(
      expect.any(Object), // Event object
      "1T" // Value (not label)
    );
  });

  it("should pass correct value (not label) to callback", async () => {
    const user = userEvent.setup();
    const onTimeframeChange = vi.fn();

    render(<TimeframeButtons onTimeframeChange={onTimeframeChange} />);

    // Click "1D" button which has value "1D"
    await user.click(screen.getByRole("button", { name: "1D" }));
    expect(onTimeframeChange).toHaveBeenCalledWith(expect.any(Object), "1D");

    // Click "5M" button which has value "5T"
    await user.click(screen.getByRole("button", { name: "5M" }));
    expect(onTimeframeChange).toHaveBeenCalledWith(expect.any(Object), "5T");
  });

  it("should update active state when different button is clicked", async () => {
    const user = userEvent.setup();
    render(<TimeframeButtons />);

    // Initially 1H is active
    const hourButton = screen.getByRole("button", { name: "1H" });
    expect(hourButton).toHaveStyle({ background: "text.secondary" });

    // Click on 1D
    const dayButton = screen.getByRole("button", { name: "1D" });
    await user.click(dayButton);

    // 1D should now be active
    expect(dayButton).toHaveStyle({ background: "text.secondary" });
  });

  it("should work without onTimeframeChange callback", async () => {
    const user = userEvent.setup();

    // Should not throw error when callback is not provided
    render(<TimeframeButtons />);

    const button = screen.getByRole("button", { name: "1M" });
    await expect(user.click(button)).resolves.not.toThrow();
  });

  it("should map all timeframe values correctly", async () => {
    const user = userEvent.setup();
    const onTimeframeChange = vi.fn();

    render(<TimeframeButtons onTimeframeChange={onTimeframeChange} />);

    const expectedMappings = [
      { label: "1M", value: "1T" },
      { label: "5M", value: "5T" },
      { label: "1H", value: "1H" },
      { label: "1D", value: "1D" },
    ];

    for (const { label, value } of expectedMappings) {
      onTimeframeChange.mockClear();
      await user.click(screen.getByRole("button", { name: label }));
      expect(onTimeframeChange).toHaveBeenCalledWith(expect.any(Object), value);
    }
  });

  it("should render buttons in correct order", () => {
    render(<TimeframeButtons />);

    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((btn) => btn.textContent);

    expect(labels).toEqual(["1M", "5M", "1H", "1D"]);
  });
});
