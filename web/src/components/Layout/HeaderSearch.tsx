import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { SearchIcon } from "@/lib/icons";
import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import Input from "../Form/Input";

const MARKET_LIST_PATH = "/";

/**
 * The one search box, rendered on every route so the header never changes shape.
 *
 * On the market list it filters the grid as you type through the `marketName` URL param. On any
 * other page the list is not on screen, so the query only travels on Enter, as a navigation to the
 * list with the same param. Both paths end in the same URL, so the list page needs nothing extra.
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

  // The box mirrors the list's active query while the list is visible, and starts empty elsewhere,
  // so a stale query never looks applied to a page it does not affect.
  useEffect(() => {
    setValue(isMarketList ? (marketName ?? "") : "");
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

  const update = (query: string) => {
    setValue(query);
    if (isMarketList) applyToList(query);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isMarketList) {
      applyToList.flush();
      return;
    }
    const query = value.trim();
    navigate(query ? `${MARKET_LIST_PATH}?marketName=${encodeURIComponent(query)}` : MARKET_LIST_PATH);
  };

  return (
    <form className="seer-header-search @container" onSubmit={submit}>
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
        isClearable
        onClear={() => update("")}
        disabled={!isClient}
        autoComplete="off"
        enterKeyHint="search"
      />
    </form>
  );
}
