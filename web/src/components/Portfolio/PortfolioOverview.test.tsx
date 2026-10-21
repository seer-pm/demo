// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PortfolioOverview from "./PortfolioOverview";

afterEach(cleanup);
describe("portfolio overview", () => {
  it("does not turn missing account data into zero balances", () => {
    render(<PortfolioOverview period="All" onPeriodChange={() => {}} supported={["1D", "1W", "1M", "All"]} />);
    expect(screen.queryByText("$0.00")).toBeNull();
    expect(screen.getAllByText("Not available").length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByRole("button", { name: "YTD" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("shows a failed request with a retry instead of a figure", () => {
    const retry = vi.fn();
    render(
      <PortfolioOverview period="1W" onPeriodChange={() => {}} error="Couldn't load trading P&L." retry={retry} />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Couldn't load trading P&L.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
