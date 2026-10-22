import { ChevronLeft, ChevronRight } from "@/lib/icons";
import type { MouseEvent, ReactNode, RefObject } from "react";

type PageSlot = number | "gap-start" | "gap-end";

// Seven slots at every position (first, last, the current page and its neighbours, two gaps), so
// the control keeps its width while the user steps through the pages.
const MAX_SLOTS = 7;

function pageSlots(current: number, pageCount: number): PageSlot[] {
  if (pageCount <= MAX_SLOTS) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "gap-end", pageCount];
  }
  if (current >= pageCount - 3) {
    return [1, "gap-start", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, "gap-start", current - 1, current, current + 1, "gap-end", pageCount];
}

/**
 * Brings the top of the list into view under the sticky header and moves focus there, so keyboard
 * and screen reader users continue from the first new item instead of from a control at the bottom.
 */
function revealResults(target: HTMLElement | null | undefined) {
  if (!target) return;
  const header = document.querySelector<HTMLElement>(".seer-header");
  const offset = (header?.getBoundingClientRect().height ?? 0) + 16;
  const top = target.getBoundingClientRect().top - offset;
  if (top < 0) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: window.scrollY + top, behavior: reduceMotion ? "auto" : "smooth" });
  }
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.setAttribute("data-pagination-results", "");
  target.focus({ preventScroll: true });
}

function isPlainLeftClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

interface PaginationProps {
  /** 1-based. */
  page: number;
  pageCount: number;
  /**
   * Renders pages as links when the page lives in the URL. Vike routes the click and keeps the
   * scroll position, and the links still open in a new tab and are crawlable.
   */
  getPageHref?: (page: number) => string;
  /** Called for pages held in component state, where there is no URL to link to. */
  onPageChange?: (page: number) => void;
  /** Total items across all pages, for the "49–72 of 2,505" summary. */
  itemCount?: number;
  pageSize?: number;
  itemLabel?: { one: string; other: string };
  /** Names the landmark, e.g. "Market pages", so it is distinguishable from the site navigation. */
  label?: string;
  /** The list this control pages through: scrolled into view and focused after a page change. */
  resultsRef?: RefObject<HTMLElement | null>;
}

export function Pagination({
  page,
  pageCount,
  getPageHref,
  onPageChange,
  itemCount,
  pageSize,
  itemLabel = { one: "item", other: "items" },
  label = "Pagination",
  resultsRef,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const current = Math.min(Math.max(Math.floor(page) || 1, 1), pageCount);

  const goTo = (target: number) => (event: MouseEvent) => {
    if (target === current) return;
    if (getPageHref) {
      // A modified click opens the page elsewhere, so this list stays where it is.
      if (isPlainLeftClick(event)) revealResults(resultsRef?.current);
      return;
    }
    onPageChange?.(target);
    revealResults(resultsRef?.current);
  };

  const control = (
    target: number,
    props: { className: string; "aria-label": string; rel?: string },
    content: ReactNode,
  ) => {
    const isCurrent = target === current;
    const shared = { ...props, "aria-current": isCurrent ? ("page" as const) : undefined, onClick: goTo(target) };
    return getPageHref ? (
      <a {...shared} href={getPageHref(target)} keep-scroll-position="true">
        {content}
      </a>
    ) : (
      <button {...shared} type="button">
        {content}
      </button>
    );
  };

  const step = (direction: "previous" | "next") => {
    const target = direction === "previous" ? current - 1 : current + 1;
    const ariaLabel = direction === "previous" ? "Previous page" : "Next page";
    const icon = direction === "previous" ? <ChevronLeft fill="currentColor" /> : <ChevronRight fill="currentColor" />;
    if (target < 1 || target > pageCount) {
      return (
        <button type="button" className="seer-pagination-step" aria-label={ariaLabel} disabled>
          {icon}
        </button>
      );
    }
    return control(
      target,
      { className: "seer-pagination-step", "aria-label": ariaLabel, rel: direction === "previous" ? "prev" : "next" },
      icon,
    );
  };

  const range =
    itemCount !== undefined && pageSize
      ? {
          first: ((current - 1) * pageSize + 1).toLocaleString(),
          last: Math.min(current * pageSize, itemCount).toLocaleString(),
          total: itemCount.toLocaleString(),
          noun: itemCount === 1 ? itemLabel.one : itemLabel.other,
        }
      : undefined;

  return (
    <nav className="seer-pagination" aria-label={label}>
      <div className="seer-pagination-inner">
        <p className="seer-pagination-summary" aria-live="polite">
          <span className="seer-pagination-position">
            Page <strong>{current.toLocaleString()}</strong> of {pageCount.toLocaleString()}
          </span>
          {range && (
            <span className="seer-pagination-range">
              <strong>
                {range.first}–{range.last}
              </strong>{" "}
              of {range.total} {range.noun}
            </span>
          )}
        </p>
        <div className="seer-pagination-controls">
          {step("previous")}
          <ul className="seer-pagination-pages">
            {pageSlots(current, pageCount).map((slot) =>
              typeof slot === "number" ? (
                <li key={slot}>
                  {control(slot, { className: "seer-pagination-page", "aria-label": `Page ${slot}` }, slot)}
                </li>
              ) : (
                <li key={slot} className="seer-pagination-gap" aria-hidden="true">
                  …
                </li>
              ),
            )}
          </ul>
          {step("next")}
        </div>
      </div>
    </nav>
  );
}
