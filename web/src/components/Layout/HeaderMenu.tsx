import { ChevronDown } from "@/lib/icons";
import clsx from "clsx";
import { ReactNode, useEffect, useId, useRef, useState } from "react";

interface HeaderMenuProps {
  /** Accessible name, for triggers whose visible content is an icon. */
  label?: string;
  trigger: ReactNode;
  triggerClassName?: string;
  align?: "start" | "end";
  children: ReactNode;
}

/**
 * A disclosure, not an ARIA menu: the panel holds ordinary links and buttons that Tab reaches in
 * order, which is what a site header's visitors expect. Escape, a click outside and focus leaving
 * the panel all close it, and Escape returns focus to the trigger so keyboard users keep their place.
 */
export function HeaderMenu({ label, trigger, triggerClassName, align = "end", children }: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="seer-header-menu"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        className={clsx("seer-header-menu-trigger", triggerClassName)}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>
      <div
        id={panelId}
        hidden={!open}
        data-align={align}
        className="seer-header-menu-panel"
        onClick={(event) => {
          // A link or an action ends the visit to the menu; a switch inside it does not.
          if ((event.target as HTMLElement).closest("a, button")) setOpen(false);
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** The chevron that marks a trigger as opening something. It turns when the trigger is expanded. */
export function MenuChevron() {
  return <ChevronDown className="seer-menu-chevron" />;
}
