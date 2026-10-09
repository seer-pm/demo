// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PortfolioOverview, { PerformanceChart } from "./PortfolioOverview";

afterEach(cleanup);
describe("portfolio performance", () => {
  it("does not turn missing account data into zero balances or a fabricated chart", () => {
    render(<PortfolioOverview period="All" onPeriodChange={() => {}} supported={["1D", "1W", "1M", "All"]} />);
    expect(screen.queryByText("$0.00")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getByText("Historical P&L is not available for this account yet.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "YTD" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("allows keyboard inspection of a losing history and restores the headline on blur", () => {
    const inspect = vi.fn();
    render(
      <PerformanceChart
        series={{ points: [0, -12, -4], start: "2026-09-01", end: "2026-09-03" }}
        onInspect={inspect}
      />,
    );
    const chart = screen.getByRole("slider");
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    expect(inspect).toHaveBeenLastCalledWith(-12, "Sep 2");
    fireEvent.keyDown(chart, { key: "Home" });
    expect(chart.getAttribute("aria-valuenow")).toBe("0");
    fireEvent.blur(chart);
    expect(inspect).toHaveBeenLastCalledWith(undefined, undefined);
  });
});
