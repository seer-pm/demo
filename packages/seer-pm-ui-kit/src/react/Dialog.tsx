import { type ReactNode, useEffect, useId, useRef } from "react";

export type DialogProps = {
  open: boolean;
  /** Called when the reader dismisses the dialog: Escape, the close button or the backdrop. */
  onClose: () => void;
  title: ReactNode;
  /** One or two lines under the title, read out with it as the dialog's description. */
  description?: ReactNode;
  /** Omitted for a confirmation that is only a title, a description and its actions. */
  children?: ReactNode;
  /** Actions, right-aligned on desktop and full width on a phone. */
  footer?: ReactNode;
  /** False while something must finish first, such as a pending transaction: Escape, the backdrop
      and the close button stop dismissing it. */
  dismissible?: boolean;
  size?: "default" | "wide";
  closeLabel?: string;
  className?: string;
};

/**
 * A modal on the native <dialog>, opened with showModal() so the browser contains focus, handles
 * Escape and renders it in the top layer. The component only keeps the element in step with `open`;
 * the state stays with the app. Needs components.css.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  size = "default",
  closeLabel = "Close",
  className = "",
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const hasDescription = description != null && description !== false;
  const hasBody = children != null && children !== false;
  const pressStartedOnBackdrop = useRef(false);
  const latest = useRef({ open, onClose, dismissible });
  latest.current = { open, onClose, dismissible };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // The browser closes the element on Escape before React hears of it, so the app's state is
    // brought back in line here, only when the app still believes the dialog is open.
    const handleClose = () => {
      if (latest.current.open) latest.current.onClose();
    };
    const handleCancel = (event: Event) => {
      if (!latest.current.dismissible) event.preventDefault();
    };
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, []);

  // A press that starts inside the panel and ends on the backdrop (selecting text, dragging a
  // slider) must not dismiss the dialog, so both ends of the click have to be on the backdrop.
  return (
    <dialog
      ref={ref}
      className={`seer-dialog${size === "wide" ? " seer-dialog-wide" : ""}${className ? ` ${className}` : ""}`}
      aria-labelledby={titleId}
      aria-describedby={hasDescription ? descriptionId : undefined}
      onMouseDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (dismissible && pressStartedOnBackdrop.current && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="seer-dialog-panel">
        <div className="seer-dialog-header">
          <div className="seer-dialog-heading">
            <h2 id={titleId} className="seer-dialog-title">
              {title}
            </h2>
            {hasDescription && (
              <p id={descriptionId} className="seer-dialog-description">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              className="seer-button seer-button-ghost seer-button-icon seer-button-sm"
              aria-label={closeLabel}
              onClick={onClose}
            >
              <span className="seer-icon seer-icon-close" aria-hidden="true" />
            </button>
          )}
        </div>
        {hasBody && <div className="seer-dialog-body">{children}</div>}
        {footer && <div className="seer-dialog-footer">{footer}</div>}
      </div>
    </dialog>
  );
}
