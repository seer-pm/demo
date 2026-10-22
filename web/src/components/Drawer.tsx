import "@/styles/drawer.css";
import clsx from "clsx";
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Names the dialog when it has no visible title. */
  label?: string;
  tabs?: React.ReactNode;
  className?: string;
}

const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

function getFocusable(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.tabIndex >= 0 && element.getClientRects().length > 0,
  );
}

// The opener can re-render while the sheet is open (the page swaps its floating button out), so a
// detached node is looked up again by the same id or accessible name.
function findOpener(opener: HTMLElement | null) {
  if (!opener || opener.isConnected) return opener;
  if (opener.id) return document.getElementById(opener.id);
  const label = opener.getAttribute("aria-label");
  return label ? document.querySelector<HTMLElement>(`[aria-label="${CSS.escape(label)}"]`) : null;
}

const CLOSE_BUTTON_CLASS =
  "flex-shrink-0 flex items-center justify-center w-11 h-11 -mr-2 rounded-control text-[var(--seer-muted)] hover:text-[var(--seer-text)] text-[24px] leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--seer-brand-purple)]";

export function Drawer({ open, onClose, children, title, label = "Trade", tabs, className }: DrawerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    document.body.classList.toggle("seer-drawer-open", open);
    // Reset any in-flight drag state so a stale translate can never persist across open/close
    setStartY(null);
    setCurrentY(null);
    setIsDragging(false);
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("seer-drawer-open");
    };
  }, [open]);

  // The opener is remembered as focus and taps move, because the page may unmount it in the same
  // render that opens the sheet, before any effect can read document.activeElement. Taps count too
  // because Safari does not focus a button when it is clicked.
  useEffect(() => {
    if (open) return;
    const remember = (target: EventTarget | null) => {
      if (!(target instanceof Element) || drawerRef.current?.contains(target)) return;
      openerRef.current = target.closest<HTMLElement>(FOCUSABLE);
    };
    const onFocusIn = (event: FocusEvent) => remember(event.target);
    const onPointerDown = (event: PointerEvent) => remember(event.target);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // While closed the sheet stays mounted below the viewport, so it is made inert to keep its controls
  // out of the tab order. Opening moves focus in, closing hands it back to whatever opened the sheet.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    drawer.toggleAttribute("inert", !open);
    if (open) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body && !drawer.contains(active)) {
        openerRef.current = active;
      }
      // The content may reset its selected tab on open, so focus waits for that render.
      const frame = requestAnimationFrame(() => {
        const initial =
          drawer.querySelector<HTMLElement>("[role='tab'][aria-selected='true']") ??
          drawer.querySelector<HTMLElement>("[data-drawer-close]");
        initial?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(frame);
    }
    const opener = findOpener(openerRef.current);
    openerRef.current = null;
    // Turning the sheet inert drops its focus to <body>. Focus that already moved elsewhere stays put.
    const active = document.activeElement;
    if (opener && (active === document.body || drawer.contains(active))) opener.focus({ preventScroll: true });
  }, [open, isMounted]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !drawerRef.current) return;
    const focusable = getFocusable(drawerRef.current);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || startY === null) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    // Only allow dragging down
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY !== null && currentY > 100) {
      // If dragged more than 100px, close the drawer
      onClose();
    }
    setStartY(null);
    setCurrentY(null);
    setIsDragging(false);
  };

  const handleTouchCancel = () => {
    // iOS fires touchcancel when it claims the gesture (e.g. for scrolling): snap back, don't close
    setStartY(null);
    setCurrentY(null);
    setIsDragging(false);
  };

  const translateY = currentY !== null ? currentY : 0;

  if (!isMounted) return null;

  const closeButton = (
    <button type="button" onClick={onClose} className={CLOSE_BUTTON_CLASS} aria-label="Close" data-drawer-close>
      <span aria-hidden="true">×</span>
    </button>
  );

  return createPortal(
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={clsx(
          "fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      {/* Drawer */}
      {/* biome-ignore lint/a11y/useSemanticElements: a native <dialog> without show()/showModal() gets closed-dialog UA styles that break the sheet's sizing on iOS WebKit */}
      <div
        role="dialog"
        ref={drawerRef}
        // A fixed height keeps the tab row still while panels of different lengths swap below it.
        className={clsx(
          "fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-surface z-[101] shadow-lg focus:outline-none h-[85dvh] max-h-[calc(100dvh-env(safe-area-inset-top))] flex flex-col w-full",
          !isDragging && "transition-transform duration-300 ease-out",
          className,
        )}
        style={{
          transform: open ? `translateY(${translateY}px)` : "translateY(100%)",
        }}
        aria-hidden={!open}
        aria-modal={open}
        aria-labelledby={title && !tabs ? titleId : undefined}
        aria-label={title && !tabs ? undefined : label}
        // Focusable so a tap on plain content keeps focus inside the sheet, where Escape and Tab are handled.
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="w-12 h-1 bg-[var(--seer-border)] rounded-full" />
        </div>

        {/* Tabs or Title */}
        {tabs ? (
          <div className="seer-drawer-header flex items-center gap-2 px-4 border-b border-[var(--seer-border)]">
            {tabs}
            {closeButton}
          </div>
        ) : title ? (
          <div className="flex items-center justify-between gap-2 px-4 pb-2 border-b border-[var(--seer-border)]">
            <h3 id={titleId} className="text-[20px] font-semibold">
              {title}
            </h3>
            {closeButton}
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
