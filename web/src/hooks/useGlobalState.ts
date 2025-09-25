import { SupportedChain } from "@/lib/chains";
import { isSeerCredits } from "@/lib/config";
import { Token } from "@/lib/tokens";
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
  preferredCollaterals: {
    [chainId: number]: Token | undefined;
  };
};

type Action = {
  setAccessToken: (accessToken: string) => void;
  addPendingOrder: (orderId: string) => void;
  removePendingOrder: (orderId: string) => void;
  migrateDeprecatedFavorites: (address: Address) => void;
  setMaxSlippage: (value: string) => void;
  setInstantSwap: (value: boolean) => void;
  setPreferredCollateral: (token: Token, chainId: number) => void;
  getPreferredCollateral: (
    chainId: number,
    swapType: "buy" | "sell",
    orderType: "market" | "limit",
  ) => Token | undefined;
};

const useGlobalState = create<State & Action>()(
  persist(
    (set) => ({
      accessToken: "",
      pendingOrders: [],
      favorites: {},
      maxSlippage: "1",
      isInstantSwap: true,
      preferredCollaterals: {},
      setAccessToken: (accessToken: string) =>
        set(() => ({
          accessToken,
        })),
      addPendingOrder: (orderId: string) => set((state) => ({ pendingOrders: [...state.pendingOrders, orderId] })),
      removePendingOrder: (orderId: string) =>
        set((state) => ({
          pendingOrders: state.pendingOrders.filter((pendingOrderId) => pendingOrderId !== orderId),
        })),
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
      setPreferredCollateral: (token: Token, chainId: number) =>
        set((state) => ({
          preferredCollaterals: {
            ...state.preferredCollaterals,
            [chainId]: token,
          },
        })),
      getPreferredCollateral: (
        chainId: number,
        swapType: "buy" | "sell",
        orderType: "market" | "limit",
      ): Token | undefined => {
        const preferredCollateral = useGlobalState.getState().preferredCollaterals[chainId];

        if (
          orderType === "limit" ||
          (swapType === "sell" &&
            preferredCollateral &&
            isSeerCredits(chainId as SupportedChain, preferredCollateral.address))
        ) {
          // SEER_CREDITS can only be used as a sell token in market orders, not as a buy token or in limit orders
          return undefined;
        }

        return preferredCollateral;
      },
    }),
    {
      name: "seer-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { useGlobalState };
