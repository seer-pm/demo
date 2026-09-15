import { type ReactElement, type ReactNode, cloneElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TooltipProps = {
  trigger: ReactElement;
  content: ReactNode;
};

type TooltipPosition = {
  top: number;
  left: number;
  background: string;
  borderColor: string;
  color: string;
  fontFamily: string;
};

export default function Tooltip({ trigger, content }: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const show = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setMounted(true);
  };

  const hide = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setMounted(false);
      setPosition(null);
    }, 150);
  };

  useEffect(() => {
    if (!mounted || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const spacing = 8;
      let top = triggerRect.top - tooltipRect.height - spacing;
      let left = triggerRect.left;

      if (top < spacing) top = triggerRect.bottom + spacing;
      left = Math.max(spacing, Math.min(left, document.documentElement.clientWidth - tooltipRect.width - spacing));

      const styles = window.getComputedStyle(triggerRef.current);
      setPosition({
        top,
        left,
        background: styles.getPropertyValue("--sd-bg-main").trim() || "#ffffff",
        borderColor: styles.getPropertyValue("--sd-border-main").trim() || "#dddddd",
        color: styles.getPropertyValue("--sd-color-main").trim() || "#333333",
        fontFamily: styles.fontFamily,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [content, mounted]);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    },
    [],
  );

  const describedTrigger = cloneElement(trigger, {
    "aria-describedby": mounted ? tooltipId : undefined,
  });

  return (
    <>
      <span
        ref={triggerRef}
        style={{ display: "inline-flex" }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {describedTrigger}
      </span>
      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={show}
            onMouseLeave={hide}
            style={{
              position: "fixed",
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              zIndex: 10000,
              maxWidth: 300,
              padding: 8,
              border: `1px solid ${position?.borderColor ?? "#dddddd"}`,
              borderRadius: 8,
              background: position?.background ?? "#ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              color: position?.color ?? "#333333",
              fontFamily: position?.fontFamily,
              fontSize: 12,
              fontWeight: 600,
              opacity: position ? 1 : 0,
              overflowWrap: "break-word",
              pointerEvents: "auto",
              transition: "opacity 0.2s ease-in-out",
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
