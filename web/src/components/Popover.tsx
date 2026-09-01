import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, ReactNode } from "react";
import ReactDOM from "react-dom";

type PopoverProps = {
  trigger: React.ReactElement;
  content: ReactNode;
  /** Accessible name for the trigger, and the panel's label. Required for icon-only triggers. */
  label?: string;
  /** Panel width in px. The default suits a short definition; legends and tables want more. */
  width?: number;
};

const VIEWPORT_MARGIN = 8;
/** Gap between the trigger and the panel. */
const GAP = 6;

export default function Popover({ trigger, content, label, width }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDialogElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  // Bumped to re-measure after a scroll or resize; the panel keeps its last position until then.
  const [tick, setTick] = useState(0);

  const close = useCallback(() => {
    setOpen(false);
    setPosition(null);
  }, []);
  const toggle = useCallback(() => {
    setPosition(null);
    setOpen((v) => !v);
  }, []);

  /**
   * Placed after layout, from the panel's measured size: this is anchored to a table header near
   * the top of the page, where the previous unconditional `translateY(-100%)` put the panel above
   * the viewport. Flips below when there is no room above, and clamps horizontally so a panel
   * anchored to a right-aligned column does not overflow the page.
   */
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;
    const anchor = triggerRef.current.getBoundingClientRect();
    const panel = contentRef.current.getBoundingClientRect();

    const roomAbove = anchor.top - VIEWPORT_MARGIN - GAP;
    const roomBelow = window.innerHeight - anchor.bottom - VIEWPORT_MARGIN - GAP;

    // Prefer above, flip below when it does not fit, and when it fits in neither take the roomier
    // side and let the panel scroll. A tall legend anchored mid-page fits in neither.
    const placeBelow = panel.height > roomAbove && (roomBelow >= panel.height || roomBelow > roomAbove);
    const room = placeBelow ? roomBelow : roomAbove;
    const height = Math.min(panel.height, room);
    const top = placeBelow ? anchor.bottom + GAP : anchor.top - GAP - height;

    const maxLeft = window.innerWidth - panel.width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, maxLeft));

    setPosition({ top: top + window.scrollY, left: left + window.scrollX, maxHeight: room });
  }, [open, tick]);

  // Move focus into the panel so a keyboard user lands on the content they just opened. Guarded on
  // `open` alone: re-measuring on scroll must not keep yanking focus back.
  useEffect(() => {
    if (open) contentRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !contentRef.current?.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  // Recomputing on scroll/resize is cheaper than a stale panel floating away from its anchor.
  useEffect(() => {
    if (!open) return;
    const reposition = () => setTick((t) => t + 1);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  return (
    <>
      {/*
        A real button: the trigger was a focusable <div> with no key handler at all, so it could be
        tabbed to and never opened. Every call site passes phrasing content, which a <button> allows.
      */}
      <button
        type="button"
        className="inline-flex cursor-pointer rounded-[1px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary"
        ref={triggerRef}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
      >
        {trigger}
      </button>
      {open &&
        ReactDOM.createPortal(
          <dialog
            open
            ref={contentRef}
            aria-label={label}
            tabIndex={-1}
            style={{
              position: "absolute",
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              visibility: position ? "visible" : "hidden",
              width: width ?? undefined,
              minWidth: width ? undefined : 150,
              maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
              maxHeight: position?.maxHeight,
              overflowY: "auto",
              zIndex: 10000,
            }}
            className="bg-base-100 border border-separator-100 rounded-[1px] p-3 shadow-[0_4px_16px_0_rgba(0,0,0,0.14)] focus:outline-none"
          >
            {content}
          </dialog>,
          document.body,
        )}
    </>
  );
}
