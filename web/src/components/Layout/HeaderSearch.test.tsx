// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
let pathname = "/markets/100/some-market";
let suggestions: { data?: unknown[]; isPending: boolean; isFetching: boolean; isError: boolean };

vi.mock("vike/client/router", () => ({ navigate: (url: string) => navigate(url) }));
vi.mock("vike-react/usePageContext", () => ({ usePageContext: () => ({ urlParsed: { pathname } }) }));
vi.mock("@/hooks/useMarketsSearchParams", () => ({
  default: () => ({ marketName: undefined, setMarketName: vi.fn() }),
}));
vi.mock("@/hooks/useMarketSuggestions", () => ({
  SUGGESTIONS_MIN_QUERY: 2,
  useMarketSuggestions: () => suggestions,
}));
vi.mock("@seer-pm/sdk", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getMarketStatus: () => "open",
  STATUS_TEXTS: { open: () => "Reports open" },
}));

import { HeaderSearch } from "./HeaderSearch";

const market = (id: string, marketName: string) => ({
  id,
  url: id,
  chainId: 100,
  marketName,
  hasLiquidity: true,
  volumeUSD: 12_345,
  liquidityUSD: 980.5,
});

function typeQuery(query: string) {
  const input = screen.getByRole("combobox", { name: "Search markets" }) as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query } });
  return input;
}

beforeEach(() => {
  navigate.mockReset();
  pathname = "/markets/100/some-market";
  suggestions = {
    data: [market("0xa", "Will BTC close above 100k?"), market("0xb", "BTC ETF inflows")],
    isPending: false,
    isFetching: false,
    isError: false,
  };
});
afterEach(cleanup);

describe("header search away from the market list", () => {
  it("opens the matches with a final see-all row once two characters are typed", () => {
    render(<HeaderSearch />);
    const input = typeQuery("b");
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.change(input, { target: { value: "btc" } });
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Will BTC close above 100k?Reports open$12.35k Vol.$980.50 Liq.",
      "BTC ETF inflowsReports open$12.35k Vol.$980.50 Liq.",
      "See all results for “btc”Enter",
    ]);
    expect(input.getAttribute("aria-expanded")).toBe("true");
  });

  it("navigates to the list on Enter when nothing is picked, and to the market when one is", () => {
    render(<HeaderSearch />);
    const input = typeQuery("btc");
    fireEvent.submit(input.closest("form")!);
    expect(navigate).toHaveBeenLastCalledWith("/?marketName=btc");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe("header-search-option-1");
    fireEvent.submit(input.closest("form")!);
    expect(navigate).toHaveBeenLastCalledWith("/markets/100/0xb");
  });

  it("reaches the see-all row with the arrows and wraps through no selection", () => {
    render(<HeaderSearch />);
    const input = typeQuery("btc");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: /See all results/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("hides the panel on Escape and brings it back on the next keystroke", () => {
    render(<HeaderSearch />);
    const input = typeQuery("btc");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input.value).toBe("btc");
    fireEvent.change(input, { target: { value: "btc " } });
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("tells an empty result apart from a search still in flight", () => {
    suggestions = { data: [], isPending: true, isFetching: true, isError: false };
    render(<HeaderSearch />);
    typeQuery("zzz");
    expect(screen.getByRole("listbox").textContent).toContain("Searching markets…");
    cleanup();
    suggestions = { data: [], isPending: false, isFetching: false, isError: false };
    render(<HeaderSearch />);
    const input = typeQuery("zzz");
    // The debounce has not forwarded the query yet, so the panel still reports a search in flight.
    expect(screen.getByRole("listbox").textContent).toContain("Searching markets…");
    expect(screen.getByRole("option", { name: /See all results for “zzz”/ })).toBeTruthy();
    expect(input.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("header search on the market list", () => {
  it("never opens a panel, since the grid itself is the live result", () => {
    pathname = "/";
    render(<HeaderSearch />);
    const input = typeQuery("btc");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });
});
