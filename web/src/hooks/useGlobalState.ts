import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  pendingOrders: string[];
};

type Action = {
  addPendingOrder: (orderId: string) => void;
  removePendingOrder: (orderId: string) => void;
};

const useGlobalState = create<State & Action>()(
  persist(
    (set) => ({
      pendingOrders: [],
      addPendingOrder: (orderId: string) => set((state) => ({ pendingOrders: [...state.pendingOrders, orderId] })),
      removePendingOrder: (orderId: string) =>
        set((state) => ({ pendingOrders: state.pendingOrders.filter((pendingOrderId) => pendingOrderId !== orderId) })),
    }),
    {
      name: "seer-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { useGlobalState };
