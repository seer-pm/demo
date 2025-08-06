import React, { useRef, useState, useLayoutEffect, ReactNode } from "react";
import ReactDOM from "react-dom";

type TooltipProps = {
  trigger: React.ReactElement;
  content: ReactNode;
};

export default function Tooltip({ trigger, content }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const hideTimeoutRef = useRef<number | null>(null);

  const show = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setMounted(true);
    setVisible(true);
  };

  const hide = () => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setMounted(false);
    }, 150);
  };

  useLayoutEffect(() => {
    if (mounted && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const spacing = 8;

      let top = triggerRect.top + scrollY - tooltipRect.height - spacing;
      let left = triggerRect.left + scrollX;

      // Flip below if not enough space above
      if (top < scrollY) {
        top = triggerRect.bottom + scrollY + spacing;
      }

      // Clamp left to avoid horizontal overflow, subtracting scrollbar width
      const viewportWidth = document.documentElement.clientWidth;
      const maxLeft = viewportWidth - tooltipRect.width - spacing;
      if (left > maxLeft) left = maxLeft;
      if (left < spacing) left = spacing;

      setPosition({ top, left });
    }
  }, [mounted]);

  return (
    <>
      <div ref={triggerRef} className="inline-block" onMouseEnter={show} onMouseLeave={hide}>
        {trigger}
      </div>

      {mounted &&
        ReactDOM.createPortal(
          <div
            ref={tooltipRef}
            onMouseEnter={show}
            onMouseLeave={hide}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 10000,
              maxWidth: 300,
              wordWrap: "break-word",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.2s ease-in-out",
              pointerEvents: "auto",
              fontSize: "12px",
              color: "#333",
              fontWeight: 600,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
