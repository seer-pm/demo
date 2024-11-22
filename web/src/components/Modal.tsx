import clsx from "clsx";
import React from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  title: string;
  content: React.ReactNode;
  id: string;
  open: boolean;
  className?: string;
}

export function Modal({ title, content, id, open, className }: ModalProps) {
  return (
    <>
      {createPortal(
        <dialog
          id={id}
          className={clsx("modal", open && "modal-open")}
          aria-label="Modal"
          aria-hidden={!open}
          open={open}
          aria-modal={open}
        >
          <div className={clsx("modal-box", className)}>
            <h3
              className="text-[24px] font-semibold text-center mb-[32px]"
              dangerouslySetInnerHTML={{ __html: title }}
            ></h3>
            <div>{content}</div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
