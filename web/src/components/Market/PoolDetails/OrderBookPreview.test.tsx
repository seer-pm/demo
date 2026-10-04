// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import OrderBookPreview from "./OrderBookPreview";
afterEach(cleanup);
it("inspects cumulative money, not shares, and maintains independent sides", () => {
  render(<OrderBookPreview />);
  expect(screen.getByText(/Not a live quote/)).toBeTruthy();
  fireEvent.focus(screen.getByRole("button", { name: /Ask 0.5793/ }));
  expect(screen.getByRole("status").textContent).toContain("15.58 sDAI cumulative cost");
  fireEvent.focus(screen.getByRole("button", { name: /Bid 0.5263/ }));
  expect(screen.getByRole("status").textContent).toContain("9.18 sDAI cumulative proceeds");
  fireEvent.change(screen.getByLabelText("Order book levels"), { target: { value: "10" } });
  expect(screen.getAllByRole("button")).toHaveLength(20);
  expect(screen.getByRole("button", { name: /Ask 0.5569/ }).textContent).toContain("0.5569");
});
