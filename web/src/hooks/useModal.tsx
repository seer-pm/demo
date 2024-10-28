import { Modal, ModalProps } from "@/components/Modal";
import { useCallback, useEffect, useState } from "react";

export function useModal(id: string) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // prevent flickering
  const modal = useCallback(
    (props: Omit<ModalProps, "id" | "open">) => (isMounted ? <Modal id={id} open={open} {...props} /> : null),
    [open, isMounted],
  );
  return {
    Modal: modal,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
