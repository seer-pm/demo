import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DropdownWrapperProps = {
  children: React.ReactElement;
  content: React.ReactElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  direction?: "left" | "right" | "auto";
  className?: string;
  offset?: { top: number; left: number; right: number };
};

const DropdownWrapper = React.forwardRef<HTMLDivElement, DropdownWrapperProps>((props, ref) => {
  const { className, children, content, offset, direction = "left", isOpen, setIsOpen } = props;
  const [actualDirection, setActualDirection] = useState<"left" | "right">("left");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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

  return (
    <div>
      <div className="flex" ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
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
              "fixed z-[1000] mt-1 border border-black-medium rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] bg-white",
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

export default DropdownWrapper;
