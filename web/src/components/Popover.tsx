import React, { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import ReactDOM from "react-dom";

type PopoverProps = {
  trigger: React.ReactElement;
  content: ReactNode;
};

export default function Popover({ trigger, content }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX, // ✅ align to left edge
      });
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !contentRef.current?.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close]);
  return (
    <>
      <div
        className="inline-block cursor-pointer"
        ref={triggerRef}
        onClick={toggle}
        tabIndex={0}
        aria-haspopup="dialog"
      >
        {trigger}
      </div>
      {open &&
        ReactDOM.createPortal(
          <div
            ref={contentRef}
            aria-modal="false"
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              transform: "translateY(-100%)",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 10000,
              minWidth: 150,
              animation: "fadeIn 0.2s ease-out",
            }}
            className="bg-base-100"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
