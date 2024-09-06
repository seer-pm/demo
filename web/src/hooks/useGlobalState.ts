import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  pendingOrders: string[];
  favorites: {
    [address: string]: string[];
  };
  maxSlippage: string;
};

type Action = {
  addPendingOrder: (orderId: string) => void;
  removePendingOrder: (orderId: string) => void;
  toggleFavorite: (address: string, marketId: string) => void;
  setMaxSlippage: (value: string) => void;
};

const useGlobalState = create<State & Action>()(
  persist(
    (set) => ({
      pendingOrders: [],
      favorites: {},
      maxSlippage: "1",
      addPendingOrder: (orderId: string) => set((state) => ({ pendingOrders: [...state.pendingOrders, orderId] })),
      removePendingOrder: (orderId: string) =>
        set((state) => ({ pendingOrders: state.pendingOrders.filter((pendingOrderId) => pendingOrderId !== orderId) })),
      toggleFavorite: (address: string, marketId: string) =>
        set((state) => {
          if (!address) {
            return state;
          }
          const favorites = structuredClone(state.favorites);
          const currentFavorites = favorites[address] ?? [];
          favorites[address] = currentFavorites.find((x) => x === marketId)
            ? currentFavorites.filter((x) => x !== marketId)
            : currentFavorites.concat(marketId);
          return { favorites };
        }),
      setMaxSlippage: (maxSlippage: string) =>
        set(() => ({
          maxSlippage,
        })),
    }),
    {
      name: "seer-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { useGlobalState };
