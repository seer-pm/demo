import { SUGGESTIONS_MIN_QUERY, useMarketSuggestions } from "@/hooks/useMarketSuggestions";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import { SearchIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { formatBigNumbers } from "@/lib/utils";
import { type Market, STATUS_TEXTS, getMarketStatus } from "@seer-pm/sdk";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import Input from "../Form/Input";

const MARKET_LIST_PATH = "/";
const LISTBOX_ID = "header-search-listbox";
const optionId = (index: number) => `header-search-option-${index}`;

function marketListUrl(query: string) {
  return query ? `${MARKET_LIST_PATH}?marketName=${encodeURIComponent(query)}` : MARKET_LIST_PATH;
}

/**
 * The one search box, rendered on every route so the header never changes shape.
 *
 * On the market list it filters the grid as you type through the `marketName` URL param: the
 * results are already on screen, so nothing else opens. On any other page the list is not visible,
 * so typing opens a panel with the first matches and a final "See all results" row. Picking a match
 * jumps straight to that market; Enter with nothing picked navigates to the list with the same
 * param, so both paths end in a URL the list page already understands.
 */
export function HeaderSearch() {
  const { urlParsed } = usePageContext();
  const isMarketList = urlParsed.pathname === MARKET_LIST_PATH;
  const { marketName, setMarketName } = useMarketsSearchParams();
  const [value, setValue] = useState(isMarketList ? (marketName ?? "") : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // `setMarketName` is a fresh closure on every render. The debounced function must outlive renders
  // to actually debounce, so it reads the latest setter through a ref instead of capturing one.
  const setMarketNameRef = useRef(setMarketName);
  setMarketNameRef.current = setMarketName;
  const applyToList = useMemo(() => debounce((query: string) => setMarketNameRef.current(query), 300), []);
  useEffect(() => () => applyToList.cancel(), [applyToList]);

  // The suggestions request waits for the same pause as the list filter, so a fast typist costs one
  // request per word rather than one per keystroke.
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const applyToSuggestions = useMemo(() => debounce((query: string) => setSuggestionQuery(query), 300), []);
  useEffect(() => () => applyToSuggestions.cancel(), [applyToSuggestions]);

  // The box mirrors the list's active query while the list is visible, and starts empty elsewhere,
  // so a stale query never looks applied to a page it does not affect.
  useEffect(() => {
    setValue(isMarketList ? (marketName ?? "") : "");
    setSuggestionQuery("");
  }, [isMarketList, marketName]);

  // Hydration guard: the input is inert until React owns it, so keystrokes are never dropped.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  // "/" focuses the box from anywhere on the page, except while typing in another field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Panel state. `dismissed` is Escape: it hides the panel for the current query only, and the next
  // keystroke brings it back. Focus leaving the form (Tab, click elsewhere) closes it as well.
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim();
  const canSuggest = !isMarketList && query.length >= SUGGESTIONS_MIN_QUERY;
  const open = canSuggest && focused && !dismissed;
  const suggestions = useMarketSuggestions(suggestionQuery, canSuggest);
  const markets = canSuggest ? (suggestions.data ?? []) : [];
  // The "See all results" row sits after the matches and is reachable with the same arrow keys.
  const seeAllIndex = markets.length;

  const update = (query: string) => {
    setValue(query);
    setDismissed(false);
    setActiveIndex(-1);
    if (isMarketList) {
      applyToList(query);
    } else {
      applyToSuggestions(query);
    }
  };

  const close = () => {
    setDismissed(true);
    setActiveIndex(-1);
  };

  const goToList = () => {
    applyToSuggestions.cancel();
    navigate(marketListUrl(query));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isMarketList) {
      applyToList.flush();
      return;
    }
    const picked = open ? markets[activeIndex] : undefined;
    if (picked) {
      navigate(paths.market(picked));
      return;
    }
    goToList();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canSuggest) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) {
          setDismissed(false);
          setActiveIndex(event.key === "ArrowDown" ? 0 : seeAllIndex);
          return;
        }
        const step = event.key === "ArrowDown" ? 1 : -1;
        // Wraps through "no selection" (-1), so Enter is always one more keypress away from its
        // plain "see all" meaning.
        const next = activeIndex + step;
        setActiveIndex(next > seeAllIndex ? -1 : next < -1 ? seeAllIndex : next);
        return;
      }
      case "Escape": {
        if (!open) return;
        // The first Escape only hides the panel. A second one reaches the browser and clears the
        // field, which is what a `type="search"` input does on its own.
        event.preventDefault();
        close();
        return;
      }
      case "Home":
      case "End": {
        if (!open || activeIndex === -1) return;
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : seeAllIndex);
        return;
      }
    }
  };

  const onBlur = (event: React.FocusEvent<HTMLFormElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setFocused(false);
    setActiveIndex(-1);
  };

  // "Searching" covers the debounce window too: before the request even starts, an empty result
  // would otherwise read as "no markets match" for a query nobody has looked up yet.
  const isSearching = canSuggest && (suggestionQuery.trim() !== query || suggestions.isFetching);
  const activeId = open && activeIndex >= 0 ? optionId(activeIndex) : undefined;

  return (
    <form className="seer-header-search @container" onSubmit={submit} onFocus={() => setFocused(true)} onBlur={onBlur}>
      <Input
        ref={inputRef}
        type="search"
        aria-label="Search markets"
        placeholder="Search markets..."
        title="Press / to search"
        className="w-full text-[13px] @[250px]:text-[14px]"
        icon={<SearchIcon fill="currentColor" />}
        value={value}
        onChange={(event) => update(event.target.value)}
        onKeyDown={onKeyDown}
        isClearable
        onClear={() => update("")}
        disabled={!isClient}
        autoComplete="off"
        enterKeyHint="search"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? LISTBOX_ID : undefined}
        aria-activedescendant={activeId}
      />
      {open && (
        <SuggestionsPanel
          query={query}
          markets={markets}
          isSearching={isSearching}
          isError={suggestions.isError}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
          onSeeAll={goToList}
        />
      )}
    </form>
  );
}

type SuggestionsPanelProps = {
  query: string;
  markets: Market[];
  isSearching: boolean;
  isError: boolean;
  activeIndex: number;
  onHover: (index: number) => void;
  onSeeAll: () => void;
};

function SuggestionsPanel({
  query,
  markets,
  isSearching,
  isError,
  activeIndex,
  onHover,
  onSeeAll,
}: SuggestionsPanelProps) {
  const seeAllIndex = markets.length;
  const status = isSearching
    ? "Searching markets…"
    : isError
      ? "Suggestions are unavailable right now."
      : markets.length === 0
        ? `No markets match “${query}”.`
        : undefined;

  return (
    // Pressing an option must not blur the input: the row's own click runs after mousedown, and a
    // blur in between would unmount the row before the click lands on it.
    <div className="seer-header-search-panel" onMouseDown={(event) => event.preventDefault()}>
      <p className="sr-only" aria-live="polite">
        {status ?? `${markets.length} markets match. Use the arrow keys to pick one.`}
      </p>
      {/* WAI-ARIA combobox: the input stays the only focusable element and names the highlighted
          row through aria-activedescendant, so the list and its options are intentionally not
          focusable. Biome reads that as non-interactive markup wearing an interactive role. */}
      {/* biome-ignore lint/a11y/useSemanticElements: a <select> cannot hold links or a two-line row */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: combobox popup listbox */}
      {/* biome-ignore lint/a11y/useFocusableInteractive: focus stays on the combobox input */}
      <ul id={LISTBOX_ID} role="listbox" aria-label="Market suggestions">
        {status && (
          <li className="seer-header-search-status" role="presentation">
            {status}
          </li>
        )}
        {markets.map((market, index) => (
          <Option
            key={`${market.chainId}_${market.id}`}
            id={optionId(index)}
            selected={activeIndex === index}
            onHover={() => onHover(index)}
          >
            <a href={paths.market(market)} tabIndex={-1}>
              <img alt="" src={NETWORK_ICON_MAPPING[market.chainId]} />
              <span>
                <span className="seer-header-search-name">{market.marketName}</span>
                <span className="seer-header-search-meta">
                  <span>{STATUS_TEXTS[getMarketStatus(market)](market.hasLiquidity)}</span>
                  <span title="Market trading volume">${formatBigNumbers(market.volumeUSD)} Vol.</span>
                  <span title="Market liquidity">${formatBigNumbers(market.liquidityUSD)} Liq.</span>
                </span>
              </span>
            </a>
          </Option>
        ))}
        <Option
          id={optionId(seeAllIndex)}
          selected={activeIndex === seeAllIndex}
          className={clsx("seer-header-search-all", markets.length > 0 && "has-divider")}
          onHover={() => onHover(seeAllIndex)}
        >
          <a
            href={marketListUrl(query)}
            tabIndex={-1}
            onClick={(event) => {
              event.preventDefault();
              onSeeAll();
            }}
          >
            <span className="seer-header-search-name">See all results for “{query}”</span>
            <kbd>Enter</kbd>
          </a>
        </Option>
      </ul>
    </div>
  );
}

type OptionProps = {
  id: string;
  selected: boolean;
  className?: string;
  onHover: () => void;
  children: React.ReactNode;
};

/** One listbox row. Hover and the arrow keys share `selected`, so there is a single highlight. */
function Option({ id, selected, className, onHover, children }: OptionProps) {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: see the listbox note in SuggestionsPanel
    <li
      id={id}
      // biome-ignore lint/a11y/useSemanticElements: see the listbox note in SuggestionsPanel
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: see the listbox note in SuggestionsPanel
      role="option"
      aria-selected={selected}
      className={clsx("seer-header-search-option", className)}
      onMouseEnter={onHover}
    >
      {children}
    </li>
  );
}
