import type { DiscussionButtonProps } from "../types";

/** Unstyled fallback when the host does not pass `components.Button`. */
export default function DefaultButton({ children, type = "button", disabled, onClick }: DiscussionButtonProps) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
