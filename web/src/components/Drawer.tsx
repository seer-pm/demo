import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  tabs?: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, children, title, tabs, className }: DrawerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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

  const translateY = currentY !== null ? currentY : 0;

  if (!isMounted) return null;

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
      <dialog
        ref={drawerRef}
        className={clsx(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-[16px] z-[101] shadow-lg max-h-[90vh] flex flex-col w-full",
          !isDragging && "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
          className,
        )}
        style={{
          transform: open ? `translateY(${translateY}px)` : "translateY(100%)",
        }}
        aria-hidden={!open}
        aria-modal={open}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-black-medium rounded-full" />
        </div>

        {/* Tabs or Title */}
        {tabs ? (
          <div className="px-6 pt-2 pb-4 border-b border-black-medium">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="text-black-secondary hover:text-black-primary text-[24px] leading-none ml-2"
                aria-label="Close drawer"
              >
                ×
              </button>
            </div>
            {tabs}
          </div>
        ) : title ? (
          <div className="px-6 pb-4 border-b border-black-medium">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-semibold">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-black-secondary hover:text-black-primary text-[24px] leading-none"
                aria-label="Close drawer"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </dialog>
    </>,
    document.body,
  );
}
