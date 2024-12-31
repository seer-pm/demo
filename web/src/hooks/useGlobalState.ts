import { Address } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  accessToken: string;
  pendingOrders: string[];
  // Deprecated. We are now storing the favorites on supabase
  favoritesDeprecated: {
    [address: string]: Address[];
  };
  maxSlippage: string;
};

type Action = {
  setAccessToken: (accessToken: string) => void;
  addPendingOrder: (orderId: string) => void;
  removePendingOrder: (orderId: string) => void;
  setMaxSlippage: (value: string) => void;
};

const useGlobalState = create<State & Action>()(
  persist(
    (set) => ({
      accessToken: "",
      pendingOrders: [],
      favoritesDeprecated: {},
      maxSlippage: "1",
      setAccessToken: (accessToken: string) =>
        set(() => ({
          accessToken,
        })),
      addPendingOrder: (orderId: string) => set((state) => ({ pendingOrders: [...state.pendingOrders, orderId] })),
      removePendingOrder: (orderId: string) =>
        set((state) => ({ pendingOrders: state.pendingOrders.filter((pendingOrderId) => pendingOrderId !== orderId) })),
      setMaxSlippage: (maxSlippage: string) =>
        set(() => ({
          maxSlippage,
        })),
    }),
    {
      name: "seer-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // @ts-ignore
          persistedState.favoritesDeprecated = persistedState.favorites;
          // @ts-ignore
          persistedState.favorites = undefined;
        }

        return persistedState;
      },
    },
  ),
);

export { useGlobalState };
