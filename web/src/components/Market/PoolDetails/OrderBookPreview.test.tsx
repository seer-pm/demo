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
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.getAllByRole("button")).toHaveLength(10);
  expect(screen.getByRole("button", { name: /Ask 0.5569/ }).textContent).toContain("0.5569");
});
it("labels the selected outcome's illustrative depth separately from the captured sample", () => {
  render(<OrderBookPreview outcome="Luiz Inácio Lula da Silva" />);
  expect(screen.getByText(/Luiz Inácio Lula da Silva · sDAI/)).toBeTruthy();
  expect(screen.getByText(/Illustrative sample depth/)).toBeTruthy();
  expect(screen.queryByText(/Frozen sample/)).toBeNull();
});

it("compares the same five levels using original cumulative shares", () => {
  render(<OrderBookPreview totalMode="shares" />);
  fireEvent.focus(screen.getByRole("button", { name: /Ask 0.5793/ }));
  expect(screen.getByRole("status").textContent).toContain("27.34 shares cumulative quantity");
  fireEvent.focus(screen.getByRole("button", { name: /Bid 0.5263/ }));
  expect(screen.getByRole("status").textContent).toContain("17.26 shares cumulative quantity");
  expect(screen.getAllByRole("button")).toHaveLength(10);
});
