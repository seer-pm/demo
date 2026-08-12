import { isTradingCreditsDisabled } from "@/lib/trading-credits";
import type { SupportedChain, Token } from "@seer-pm/sdk";
import { isTradingCredits } from "@seer-pm/sdk";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type LiquidityChartLayout = "horizontal" | "vertical";

type State = {
  accessToken: string;
  maxSlippage: string;
  useSmartAccount: boolean;
  liquidityChartLayout: LiquidityChartLayout;
  preferredCollaterals: {
    [chainId: number]: Token | undefined;
  };
};

type Action = {
  setAccessToken: (accessToken: string) => void;
  setMaxSlippage: (value: string) => void;
  setUseSmartAccount: (value: boolean) => void;
  setLiquidityChartLayout: (layout: LiquidityChartLayout) => void;
  setPreferredCollateral: (token: Token, chainId: number) => void;
  getPreferredCollateral: (chainId: number, swapType: "buy" | "sell") => Token | undefined;
};

const useGlobalState = create<State & Action>()(
  persist(
    (set) => ({
      accessToken: "",
      maxSlippage: "1",
      useSmartAccount: true,
      liquidityChartLayout: "vertical",
      preferredCollaterals: {},
      setAccessToken: (accessToken: string) =>
        set(() => ({
          accessToken,
        })),
      setMaxSlippage: (maxSlippage: string) =>
        set(() => ({
          maxSlippage,
        })),
      setUseSmartAccount: (useSmartAccount: boolean) =>
        set(() => ({
          useSmartAccount,
        })),
      setLiquidityChartLayout: (liquidityChartLayout: LiquidityChartLayout) =>
        set(() => ({
          liquidityChartLayout,
        })),
      setPreferredCollateral: (token: Token, chainId: number) =>
        set((state) => ({
          preferredCollaterals: {
            ...state.preferredCollaterals,
            [chainId]: token,
          },
        })),
      getPreferredCollateral: (chainId: number, swapType: "buy" | "sell"): Token | undefined => {
        const preferredCollateral = useGlobalState.getState().preferredCollaterals[chainId];

        if (
          preferredCollateral &&
          isTradingCreditsDisabled() &&
          isTradingCredits(chainId as SupportedChain, preferredCollateral.address)
        ) {
          return undefined;
        }

        if (
          preferredCollateral &&
          isTradingCredits(chainId as SupportedChain, preferredCollateral.address) &&
          swapType === "sell"
        ) {
          // Trading credits can only be used as a sell token in market orders, not as a buy token or in limit orders
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
