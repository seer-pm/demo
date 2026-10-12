import { type ReactNode, useEffect, useRef } from "react";

/**
 * A native `<details>` that also closes on an outside click or Escape, the way the app's
 * popovers do. Listeners attach only while it is open, so a page full of these costs nothing
 * until one is expanded.
 */
export function DismissibleDetails({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const close = () => {
      details.open = false;
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!details.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onToggle = () => {
      if (details.open) {
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);
      } else {
        document.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("keydown", onKeyDown);
      }
    };
    details.addEventListener("toggle", onToggle);
    return () => {
      details.removeEventListener("toggle", onToggle);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      {children}
    </details>
  );
}
