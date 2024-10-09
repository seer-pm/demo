import { Modal, ModalProps } from "@/components/Modal";
import { useCallback, useState } from "react";

export function useModal(id: string) {
  const [open, setOpen] = useState(false);
  // prevent flickering
  const modal = useCallback(
    (props: Omit<ModalProps, "id" | "open">) => <Modal id={id} open={open} {...props} />,
    [open],
  );
  return {
    Modal: modal,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
