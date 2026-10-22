import clsx from "clsx";
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DropdownWrapperProps = {
  children: React.ReactElement;
  content: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  direction?: "left" | "right" | "auto";
  className?: string;
  contentId?: string;
  offset?: { top: number; left: number; right: number };
  /** Renders the content as a single-select listbox of `DropdownOption` items, named by this label. */
  listboxLabel?: string;
  /** Accessible name for the trigger when its visible content alone does not say what it picks. */
  triggerLabel?: string;
  triggerClassName?: string;
};

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--seer-brand-purple)]";

function getOptions(container: HTMLElement | null) {
  return Array.from(container?.querySelectorAll<HTMLElement>("[role='option']") ?? []);
}

const DropdownWrapper = React.forwardRef<HTMLDivElement, DropdownWrapperProps>((props, ref) => {
  const {
    className,
    children,
    content,
    offset,
    direction = "left",
    isOpen,
    setIsOpen,
    contentId,
    listboxLabel,
    triggerLabel,
    triggerClassName,
  } = props;
  const [actualDirection, setActualDirection] = useState<"left" | "right">("left");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const popupId = contentId ?? `${generatedId}-popup`;
  const isListbox = listboxLabel !== undefined;
  // A caller that already passes a native button keeps it as the trigger, since a button cannot nest
  // inside another one. Anything else is wrapped in a button so it is reachable by keyboard.
  const childIsButton = React.isValidElement(children) && children.type === "button";

  const focusTrigger = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const target = trigger.matches("button") ? trigger : trigger.querySelector<HTMLElement>("button, [tabindex]");
    target?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      focusTrigger();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setIsOpen]);

  // A listbox takes focus on its selected option, so the arrow keys work as soon as it opens.
  // The content is hidden until positioned, and a hidden element cannot take focus.
  useEffect(() => {
    if (!isOpen || !isListbox || !isPositioned) return;
    const options = getOptions(contentRef.current);
    const selected = options.find((option) => option.getAttribute("aria-selected") === "true");
    (selected ?? options[0])?.focus({ preventScroll: true });
  }, [isOpen, isListbox, isPositioned]);

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (triggerRef.current && contentRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentWidth = contentRef.current.offsetWidth;

        // Calculate available space on both sides
        const spaceOnRight = window.innerWidth - triggerRect.right;
        const spaceOnLeft = triggerRect.left;

        // Determine direction
        let newDirection: "left" | "right" = direction as "left" | "right";

        if (direction === "auto") {
          // If content fits on right side, use left alignment (expand right)
          if (spaceOnRight >= contentWidth) {
            newDirection = "left";
          }
          // If content doesn't fit on right but fits on left, use right alignment (expand left)
          else if (spaceOnLeft >= contentWidth) {
            newDirection = "right";
          }
          // If content doesn't fit on either side, use the side with more space
          else {
            newDirection = spaceOnRight >= spaceOnLeft ? "left" : "right";
          }
        }

        setActualDirection(newDirection);

        setDropdownPosition({
          top: triggerRect.bottom,
          left: triggerRect.left,
          right: triggerRect.right,
        });
        setIsPositioned(true);
      }
    };

    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);
    }

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside trigger or dropdown
      const isClickInsideTrigger = triggerRef.current?.contains(event.target as Node);
      const isClickInsideDropdown = contentRef?.current?.contains(event.target as Node);
      if (!isClickInsideTrigger && !isClickInsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape is consumed here so a dialog that hosts the dropdown (the mobile trade sheet) stays open.
  // The document listener above still covers Escape pressed anywhere else.
  const closeOnEscape = (event: React.KeyboardEvent) => {
    if (!isOpen || event.key !== "Escape") return false;
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(false);
    focusTrigger();
    return true;
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (closeOnEscape(event)) return;
    if (isListbox && !isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }
    // A portalled disclosure keeps its keyboard order next to its trigger.
    if (!contentId || !isOpen || event.key !== "Tab" || event.shiftKey) return;
    const first = contentRef.current?.querySelector<HTMLElement>("button, input, a[href], [tabindex='0']");
    if (!first) return;
    event.preventDefault();
    first.focus({ preventScroll: true });
  };

  const onListboxKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      // The listbox lives at the end of <body>. Handing focus back to the trigger before the default
      // Tab action lets the browser continue the page order from where the dropdown sits.
      setIsOpen(false);
      focusTrigger();
      return;
    }
    const options = getOptions(contentRef.current);
    const index = options.indexOf(document.activeElement as HTMLElement);
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = Math.min(index + 1, options.length - 1);
        break;
      case "ArrowUp":
        next = Math.max(index - 1, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = options.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    options[next]?.focus();
  };

  const trigger = childIsButton ? (
    <div
      className="flex"
      ref={triggerRef as React.RefObject<HTMLDivElement>}
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={onTriggerKeyDown}
    >
      {children}
    </div>
  ) : (
    <button
      type="button"
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      className={clsx("flex text-left", FOCUS_RING, triggerClassName)}
      aria-haspopup={isListbox ? "listbox" : undefined}
      aria-expanded={isOpen}
      aria-controls={isOpen ? popupId : undefined}
      aria-label={triggerLabel}
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={onTriggerKeyDown}
    >
      {children}
    </button>
  );

  return (
    <div>
      {trigger}

      {isOpen &&
        createPortal(
          <div
            id={popupId}
            role={isListbox ? "listbox" : undefined}
            aria-label={listboxLabel}
            onClick={(event) => {
              // Picking an option closes the listbox, so focus returns to the trigger rather than to <body>.
              if (isListbox && (event.target as HTMLElement).closest("[role='option']")) focusTrigger();
            }}
            onKeyDown={(event) => {
              if (closeOnEscape(event)) return;
              if (isListbox) {
                onListboxKeyDown(event);
                return;
              }
              if (!contentId || event.key !== "Tab") return;
              const controls = contentRef.current?.querySelectorAll<HTMLElement>(
                "button, input, a[href], [tabindex='0']",
              );
              if (!controls?.length) return;
              const boundary = event.shiftKey ? controls[0] : controls[controls.length - 1];
              if (document.activeElement !== boundary) return;
              if (event.shiftKey) event.preventDefault();
              setIsOpen(false);
              focusTrigger();
            }}
            ref={(node) => {
              // Combine refs
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            style={{
              visibility: isPositioned ? "visible" : "hidden",
              top: `${dropdownPosition.top + (offset?.top ?? 0)}px`,
              ...(actualDirection === "left"
                ? { left: `${dropdownPosition.left + (offset?.left ?? 0)}px` }
                : {
                    right: `${window.innerWidth - dropdownPosition.right - (offset?.right ?? 0)}px`,
                  }),
            }}
            className={clsx(
              "fixed z-[1000] mt-1 border border-separator-100 rounded-surface shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] bg-base-100",
              isListbox && "p-2",
              className,
            )}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
});

type DropdownOptionProps = {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
};

/** One choice inside a `DropdownWrapper` with a `listboxLabel`. Enter or Space picks it. */
export function DropdownOption({ selected, onSelect, children, className }: DropdownOptionProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a native <option> only renders inside <select>, which cannot show token images
    <div
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.currentTarget.click();
      }}
      className={clsx(
        "px-[15px] py-[10px] hover:bg-[var(--seer-surface-raised)] flex items-center gap-2 cursor-pointer",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--seer-brand-purple)]",
        selected && "active bg-[var(--seer-accent-soft)] font-semibold text-[var(--seer-accent-text)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default DropdownWrapper;
