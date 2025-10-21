import { SupportedChain } from "@/lib/chains";
import { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC, config } from "@/wagmi";
import {
  EVM,
  LiFiStep,
  QuoteRequest,
  RouteExtended,
  convertQuoteToRoute,
  createConfig,
  executeRoute,
  getQuote,
} from "@lifi/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWalletClient, switchChain } from "@wagmi/core";
import { Address, parseUnits } from "viem";
import { arbitrum, base, gnosis, mainnet, optimism } from "viem/chains";
import { useAccount } from "wagmi";

interface BridgeQuoteParams {
  fromChainId?: number;
  toChainId: SupportedChain;
  fromTokenAddress?: Address;
  fromTokenDecimals?: number;
  toTokenAddress: Address;
  amount: string;
  userAddress?: Address;
}

interface BridgeQuoteResult {
  quote: LiFiStep;
  destinationToken: Address;
}

interface ExecuteBridgeParams {
  quote: LiFiStep;
  onUpdate?: (route: RouteExtended) => void;
}

export const lifiConfig = createConfig({
  integrator: "seer-pm-xyz",
  rpcUrls: {
    [arbitrum.id]: [ARBITRUM_RPC],
    [optimism.id]: [OPTIMISM_RPC],
    [base.id]: [BASE_RPC],
    [gnosis.id]: [GNOSIS_RPC],
    [mainnet.id]: [MAINNET_RPC],
  },
  providers: [
    EVM({
      getWalletClient: () => getWalletClient(config),
      switchChain: async (chainId) => {
        const chain = await switchChain(config, { chainId });
        return getWalletClient(config, { chainId: chain.id });
      },
    }),
  ],
  // TODO: this could be disbled, but lifiConfig.setChains(chains) is not working
  preloadChains: true,
});

export function useBridgeQuote({
  fromChainId,
  toChainId,
  fromTokenAddress,
  fromTokenDecimals,
  toTokenAddress,
  amount,
  userAddress,
}: BridgeQuoteParams) {
  return useQuery<BridgeQuoteResult, Error>({
    queryKey: [
      "bridgeQuote",
      fromChainId,
      toChainId,
      fromTokenAddress,
      fromTokenDecimals,
      toTokenAddress,
      amount,
      userAddress,
    ],
    queryFn: async () => {
      if (!amount || Number(amount) <= 0) {
        throw new Error("Invalid amount");
      }
      if (!userAddress || !fromChainId || !fromTokenAddress || !fromTokenDecimals) {
        throw new Error("Required parameters missing");
      }

      const quoteRequest: QuoteRequest = {
        fromChain: fromChainId,
        toChain: toChainId,
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        fromAmount: parseUnits(amount, fromTokenDecimals).toString(),
        fromAddress: userAddress,
        toAddress: userAddress,
      };

      try {
        const quote = await getQuote(quoteRequest);

        return {
          quote,
          destinationToken: toTokenAddress,
        };
      } catch (error) {
        console.error("Bridge quote error:", error);
        throw new Error(`Failed to get bridge quote: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
    enabled:
      !!fromChainId &&
      !!toChainId &&
      !!fromTokenAddress &&
      !!toTokenAddress &&
      !!fromTokenDecimals &&
      !!amount &&
      Number(amount) > 0 &&
      !!userAddress,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

export function useExecuteBridge() {
  const queryClient = useQueryClient();
  const { chainId } = useAccount();

  return useMutation<RouteExtended, Error, ExecuteBridgeParams>({
    mutationFn: async ({ quote, onUpdate }) => {
      try {
        const route = convertQuoteToRoute(quote);

        const executedRoute = await executeRoute(route, {
          updateRouteHook:
            onUpdate ||
            ((route) => {
              console.log("Route updated:", route);
            }),
        });

        return executedRoute;
      } catch (error) {
        console.error("Bridge execution error:", error);
        throw new Error(`Failed to execute bridge: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
    onSuccess: async (_, { quote }) => {
      // Invalidate token balance queries to refresh balances after successful bridge
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });

      // Switch to destination chain if not already on it
      if (chainId !== quote.action.toChainId) {
        try {
          await switchChain(config, { chainId: quote.action.toChainId });
          console.log(`Switched to chain ${quote.action.toChainId}`);
        } catch (error) {
          console.error("Failed to switch chain:", error);
          // Don't throw error here as the bridge was successful
        }
      }
    },
  });
}
