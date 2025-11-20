import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderWithChakra as render } from "../test-utils";
import SymbolMenu from "../../src/components/layout/SymbolMenu";
import { SYMBOLS } from "../../src/config";

describe("SymbolMenu", () => {
  // Helper function to get menu trigger (there are 2 buttons, we want the outer one with haspopup)
  const getMenuTrigger = () => {
    const triggers = screen.getAllByRole("button", { haspopup: "menu" });
    return triggers[0]; // Get the outer trigger button
  };

  it("should render menu trigger button", () => {
    render(<SymbolMenu activeTicker="AAPL" onSelectSymbol={vi.fn()} />);

    // Menu trigger should be present
    const trigger = getMenuTrigger();
    expect(trigger).toBeInTheDocument();
  });

  it("should display all symbols when menu is opened", async () => {
    const user = userEvent.setup();
    render(<SymbolMenu activeTicker="AAPL" onSelectSymbol={vi.fn()} />);

    // Open menu
    const trigger = getMenuTrigger();
    await user.click(trigger);

    // All symbols should be visible
    SYMBOLS.forEach((symbol) => {
      expect(screen.getByText(symbol)).toBeInTheDocument();
    });
  });

  it("should highlight active ticker", async () => {
    const user = userEvent.setup();
    render(<SymbolMenu activeTicker="MSFT" onSelectSymbol={vi.fn()} />);

    // Open menu
    await user.click(getMenuTrigger());

    // MSFT should have active styling (fontWeight: 600)
    const msftItem = screen.getByText("MSFT");
    expect(msftItem).toHaveStyle({ fontWeight: "600" });

    // Other symbols should not have active styling
    const aaplItem = screen.getByText("AAPL");
    expect(aaplItem).toHaveStyle({ fontWeight: "400" });
  });

  it("should call onSelectSymbol when symbol is clicked", async () => {
    const user = userEvent.setup();
    const onSelectSymbol = vi.fn();

    render(<SymbolMenu activeTicker="AAPL" onSelectSymbol={onSelectSymbol} />);

    // Open menu and click on TSLA
    await user.click(getMenuTrigger());
    await user.click(screen.getByText("TSLA"));

    expect(onSelectSymbol).toHaveBeenCalledTimes(1);
    expect(onSelectSymbol).toHaveBeenCalledWith("TSLA");
  });

  it("should render exactly 10 symbols", async () => {
    const user = userEvent.setup();
    render(<SymbolMenu activeTicker="AAPL" onSelectSymbol={vi.fn()} />);

    // Open menu
    await user.click(getMenuTrigger());

    // Count menu items (using menuitem role)
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(10);
  });

  it("should render symbols in correct order", async () => {
    const user = userEvent.setup();
    render(<SymbolMenu activeTicker="AAPL" onSelectSymbol={vi.fn()} />);

    // Open menu
    await user.click(getMenuTrigger());

    const menuItems = screen.getAllByRole("menuitem");
    const symbolTexts = menuItems.map((item) => item.textContent);

    expect(symbolTexts).toEqual(SYMBOLS);
  });

  it("should work with different active tickers", async () => {
    const user = userEvent.setup();

    // Test with AAPL as active
    const { rerender } = render(
      <SymbolMenu activeTicker="AAPL" onSelectSymbol={vi.fn()} />
    );
    await user.click(getMenuTrigger());
    expect(screen.getByText("AAPL")).toHaveStyle({ fontWeight: "600" });

    // Close menu by clicking outside (cleanup for next test)
    await user.keyboard("{Escape}");

    // Re-render with NVDA as active
    rerender(<SymbolMenu activeTicker="NVDA" onSelectSymbol={vi.fn()} />);
    await user.click(getMenuTrigger());
    expect(screen.getByText("NVDA")).toHaveStyle({ fontWeight: "600" });
    expect(screen.getByText("AAPL")).toHaveStyle({ fontWeight: "400" });
  });
});
