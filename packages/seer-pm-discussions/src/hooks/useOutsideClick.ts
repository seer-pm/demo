import { type RefObject, useEffect } from "react";

export function useOutsideClick(ref: RefObject<HTMLElement | null>, handler: (event: Event) => void) {
  useEffect(() => {
    const listener = (event: Event) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default useOutsideClick;
