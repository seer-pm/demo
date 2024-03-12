import { ToastContainer, ToastOptions } from "react-toastify";
import { toastError, toastInfo, toastSuccess } from "./toastify";

export default {
  Toasts: () => {
    const options: ToastOptions = { containerId: "DemoToasts", autoClose: false };
    toastInfo({ title: "Pending Transaction", subtitle: "You will be informed when it is confirmed.", options });
    toastInfo({ title: "Syncing Data", options });
    toastSuccess({
      title: "Transaction Confirmed",
      subtitle: "Your payment was successfully deposited into escrow.",
      options,
    });
    toastError({ title: "Transaction Failed", subtitle: "The transaction failed.", options });

    return (
      <div className="space-y-4 flex flex-col items-center pt-10">
        <ToastContainer containerId="DemoToasts" position="bottom-left" />
      </div>
    );
  },
};
