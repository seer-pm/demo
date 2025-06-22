import { Address } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  accessToken: string;
  pendingOrders: string[];
  // Deprecated. We are now storing the favorites on supabase
  favorites: {
    [address: string]: Address[];
  };
  maxSlippage: string;
  isInstantSwap: boolean;
};

type Action = {
  setAccessToken: (accessToken: string) => void;
  addPendingOrder: (orderId: string) => void;
  removePendingOrder: (orderId: string) => void;
  migrateDeprecatedFavorites: (address: Address) => void;
  setMaxSlippage: (value: string) => void;
  setInstantSwap: (value: boolean) => void;
};

const useGlobalState = create<State & Action>()(
  persist(
    (set) => ({
      accessToken: "",
      pendingOrders: [],
      favorites: {},
      maxSlippage: "1",
      isInstantSwap: false,
      setAccessToken: (accessToken: string) =>
        set(() => ({
          accessToken,
        })),
      addPendingOrder: (orderId: string) => set((state) => ({ pendingOrders: [...state.pendingOrders, orderId] })),
      removePendingOrder: (orderId: string) =>
        set((state) => ({ pendingOrders: state.pendingOrders.filter((pendingOrderId) => pendingOrderId !== orderId) })),
      migrateDeprecatedFavorites: (address: Address) =>
        set((state) => {
          if (!address) {
            return state;
          }
          const favorites = structuredClone(state.favorites);
          delete favorites[address];
          return { favorites };
        }),
      setMaxSlippage: (maxSlippage: string) =>
        set(() => ({
          maxSlippage,
        })),
      setInstantSwap: (isInstantSwap: boolean) =>
        set(() => ({
          isInstantSwap,
        })),
    }),
    {
      name: "seer-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { useGlobalState };
