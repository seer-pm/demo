import { Modal, ModalProps } from "@/components/Modal";
import { useCallback, useEffect, useRef, useState } from "react";

export function useModal(id: string, closeOnClickOutside?: boolean) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  //click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && closeOnClickOutside && modalRef.current) {
        const modalBox = modalRef.current.querySelector(".modal-box");
        if (modalBox && !modalBox.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, closeOnClickOutside]);

  // prevent flickering
  const modal = useCallback(
    (props: Omit<ModalProps, "id" | "open">) =>
      isMounted ? <Modal ref={modalRef} id={id} open={open} {...props} /> : null,
    [open, isMounted],
  );
  return {
    Modal: modal,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
