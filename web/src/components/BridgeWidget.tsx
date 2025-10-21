import { useBridgeQuote, useExecuteBridge } from "@/hooks/useBridgeQuote";
import { useModal } from "@/hooks/useModal";
import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { CheckCircleIcon, CloseCircleOutlineIcon, ExclamationCircleIcon, InfoCircleIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance } from "@/lib/utils";
import { ARBITRUM_RPC, BASE_RPC, GNOSIS_RPC, OPTIMISM_RPC, connectors, config as wagmiConfig } from "@/wagmi";
import { ChainType, ExecutionStatus, Process, RouteExtended, getChains } from "@lifi/sdk";
import { useSyncWagmiConfig } from "@lifi/wallet-management";
import { useQuery } from "@tanstack/react-query";
import { getBalance } from "@wagmi/core";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Chain, formatUnits } from "viem";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { http, createConfig } from "wagmi";
import { arbitrum, base, optimism } from "wagmi/chains";
import { Alert } from "./Alert";
import Button from "./Form/Button";
import Input from "./Form/Input";
import { CollateralDropdown } from "./Market/CollateralDropdown";
import { TokenImage } from "./Market/SwapTokens/TokenSelector";

const chains = [arbitrum, base, optimism, gnosis];

const bridgeConfig = createConfig({
  chains: chains as unknown as [Chain, ...Chain[]],
  transports: {
    [arbitrum.id]: http(ARBITRUM_RPC),
    [base.id]: http(BASE_RPC),
    [optimism.id]: http(OPTIMISM_RPC),
    [gnosis.id]: http(GNOSIS_RPC),
  },
});

type SupportedBirdgeChain = 42161 | 8453 | 10 | 100;

const TOKENS: Record<SupportedBirdgeChain, { symbol: string; address: Address; decimals: number }[]> = {
  [arbitrum.id]: [
    { symbol: "USDT", address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", decimals: 6 },
    { symbol: "USDC", address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", decimals: 6 },
    { symbol: "USDE", address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", decimals: 18 },
    { symbol: "USDS", address: "0x6491c05a82219b8d1479057361ff1654749b876b", decimals: 18 },
    { symbol: "DAI", address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", decimals: 18 },
  ],
  [base.id]: [
    { symbol: "USDT", address: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2", decimals: 6 },
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    { symbol: "USDE", address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", decimals: 18 },
    { symbol: "USDS", address: "0x820c137fa70c8691f0e44dc420a5e53c168921dc", decimals: 18 },
    { symbol: "DAI", address: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", decimals: 18 },
  ],
  [optimism.id]: [
    { symbol: "USDT", address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", decimals: 6 },
    { symbol: "USDC", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
    { symbol: "USDE", address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", decimals: 18 },
    { symbol: "USDS", address: "0x4f13a96ec5c4cf34e442b46bbd98a0791f20edc3", decimals: 18 },
    { symbol: "DAI", address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", decimals: 18 },
  ],
  [gnosis.id]: [
    { symbol: "USDT", address: "0x4ecaba5870353805a9f068101a40e0f32ed605c6", decimals: 6 },
    { symbol: "USDC", address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0", decimals: 6 },
    { symbol: "sDAI", address: "0xaf204776c7245bf4147c2612bf6e5972ee483701", decimals: 18 },
  ],
};

function useBridgeTokenBalances(
  owner: Address | undefined,
  tokensByChain: { chainId: SupportedBirdgeChain; tokens: Address[] }[],
) {
  return useQuery<
    | Array<{
        symbol: string;
        address: Address;
        decimals: number;
        name: string;
        chainId: SupportedBirdgeChain;
        balance: bigint;
      }>
    | undefined,
    Error
  >({
    enabled: !!owner && tokensByChain.length > 0,
    queryKey: ["useBridgeTokenBalances", owner, tokensByChain],
    queryFn: async () => {
      const tokensWithBalance: Array<{
        symbol: string;
        address: Address;
        decimals: number;
        name: string;
        chainId: SupportedBirdgeChain;
        balance: bigint;
      }> = [];

      for (const { chainId, tokens } of tokensByChain) {
        for (const tokenAddress of tokens) {
          const balance = (
            await getBalance(bridgeConfig, {
              address: owner!,
              token:
                tokenAddress.toLowerCase() === "0x0000000000000000000000000000000000000000" ? undefined : tokenAddress,
              chainId,
            })
          ).value;

          // Only include tokens with balance > 0
          if (balance > 0n) {
            const tokenInfo = TOKENS[chainId].find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase());
            if (tokenInfo) {
              tokensWithBalance.push({
                symbol: tokenInfo.symbol,
                address: tokenAddress as Address,
                decimals: tokenInfo.decimals,
                name: tokenInfo.symbol,
                chainId,
                balance,
              });
            }
          }
        }
      }

      // Sort tokens by balance
      return tokensWithBalance.sort((a, b) => {
        const aValue = Number(formatUnits(a.balance, a.decimals));
        const bValue = Number(formatUnits(b.balance, b.decimals));
        return bValue - aValue;
      });
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    retry: 2,
  });
}

interface BridgeFormValues {
  amount: string;
}

export const CustomWagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  // Load EVM chains from LI.FI API using getChains action from LI.FI SDK
  const { data: chains } = useQuery({
    queryKey: ["chains"] as const,
    queryFn: async () => {
      const chains = await getChains({
        chainTypes: [ChainType.EVM],
      });
      // TODO: lifiConfig.setChains doesn't exist, so we are using preloadChains: true
      //lifiConfig.setChains(chains);
      return chains;
    },
  });

  // Synchronize fetched chains with Wagmi config and update connectors
  useSyncWagmiConfig(wagmiConfig, connectors, chains);

  return children;
};

export function BridgeWidget({ toChainId }: { toChainId: SupportedChain }) {
  const { isConnected, address } = useAccount();
  const { open } = useWeb3Modal();

  const { Modal: BridgeModal, openModal: openBridgeModal, closeModal: closeBridgeModal } = useModal("bridge-modal");

  const [selectedToken, setSelectedToken] = useState<{
    symbol: string;
    address: Address;
    decimals: number;
    chainId: SupportedBirdgeChain;
  } | null>(null);

  const [executionStatus, setExecutionStatus] = useState<{
    currentStep: number;
    totalSteps: number;
    stepStatus: ExecutionStatus;
    processes: Process[];
  } | null>(null);

  const useFormReturn = useForm<BridgeFormValues>({
    mode: "all",
    defaultValues: {
      amount: "",
    },
  });

  const {
    register,
    formState: { isValid },
    watch,
    setValue,
  } = useFormReturn;

  const [amount] = watch(["amount"]);

  const tokensByChain = Object.entries(TOKENS)
    .filter(([chainId]) => Number(chainId) !== toChainId)
    .map(([chainId, tokens]) => ({
      chainId: Number(chainId) as SupportedBirdgeChain,
      tokens: tokens.map((token) => token.address),
    }));

  const { data: tokensWithBalance, isLoading } = useBridgeTokenBalances(address, tokensByChain);

  const destinationToken = COLLATERAL_TOKENS[toChainId].primary;

  const {
    data: bridgeQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useBridgeQuote({
    fromChainId: selectedToken?.chainId,
    toChainId,
    fromTokenAddress: selectedToken?.address,
    fromTokenDecimals: selectedToken?.decimals,
    toTokenAddress: destinationToken.address,
    amount: amount || "0",
    userAddress: address,
  });

  const executeBridgeMutation = useExecuteBridge();
  const selectedTokenBalance =
    selectedToken && tokensWithBalance
      ? tokensWithBalance.find((t) => t.address === selectedToken.address && t.chainId === selectedToken.chainId)
          ?.balance || 0n
      : 0n;

  // Set first token with balance as default when tokens are loaded
  useEffect(() => {
    if (tokensWithBalance && tokensWithBalance.length > 0 && !selectedToken) {
      const firstToken = tokensWithBalance[0];
      setSelectedToken(firstToken);
    }
  }, [tokensWithBalance, selectedToken]);

  const handleTokenSelection = (token: {
    symbol: string;
    address: Address;
    decimals: number;
  }) => {
    const fullToken = tokensWithBalance?.find((t) => t.address === token.address && t.symbol === token.symbol);
    if (fullToken) {
      setSelectedToken(fullToken);
    }
  };

  const getExecutionStatus = (
    route: RouteExtended,
  ): {
    currentStep: number;
    totalSteps: number;
    stepStatus: ExecutionStatus;
    processes: Process[];
  } => {
    const processes: Process[] = [];
    let currentStep = 0;
    let stepStatus: ExecutionStatus = "PENDING";

    // Check if route has steps (it should after convertQuoteToRoute)
    if (route.steps && Array.isArray(route.steps)) {
      route.steps.forEach((step, index) => {
        // Use step.execution.status instead of route.status
        if (step.execution?.status) {
          stepStatus = step.execution.status;

          // Count completed steps
          if (step.execution.status === "DONE" || step.execution.status === "FAILED") {
            currentStep = index + 1;
          }
        }

        // Collect processes and transaction hashes
        if (step.execution?.process) {
          processes.push(...step.execution.process);
        }
      });

      return {
        currentStep,
        totalSteps: route.steps.length,
        stepStatus,
        processes,
      };
    }

    // Fallback for single step (quote)
    return {
      currentStep: 0,
      totalSteps: 1,
      stepStatus: "PENDING" as ExecutionStatus,
      processes: [],
    };
  };

  const handleBridgeSubmit = async () => {
    if (!bridgeQuote?.quote) {
      console.error("No bridge quote available");
      return;
    }

    try {
      setExecutionStatus({
        currentStep: 0,
        totalSteps: 1, // Quote is a single step
        stepStatus: "PENDING",
        processes: [],
      });

      await executeBridgeMutation.mutateAsync({
        quote: bridgeQuote.quote,
        onUpdate: (route: RouteExtended) => {
          const status = getExecutionStatus(route);
          setExecutionStatus(status);
        },
      });
    } catch (error) {
      console.error("Bridge execution failed:", error);
      setExecutionStatus(null);
    }
  };

  const renderBridgeForm = () => {
    return (
      <div className="space-y-6">
        {/* Bridge Form */}
        <form className="space-y-4" onSubmit={useFormReturn.handleSubmit(handleBridgeSubmit)}>
          {/* Loading State */}
          {isLoading && <div className="shimmer-container w-full h-[20px]"></div>}

          {/* Not Connected State */}
          {!isConnected && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Connect your wallet to bridge tokens</p>
              <Button variant="primary" onClick={() => open({ view: "Connect" })} text="Connect Wallet" />
            </div>
          )}

          {/* No Tokens State */}
          {!tokensWithBalance || tokensWithBalance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No tokens with balance found.</p>
              <p className="text-sm text-gray-500">
                We were looking for stablecoins like USDT, USDC, USDe or DAI on Arbitrum, Base or Optimism.
              </p>
              <p>
                To bridge another token, you can visit{" "}
                <a
                  href={paths.xDAIBridge()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-primary hover:underline"
                >
                  Jumper Exchange
                </a>
              </p>
            </div>
          ) : (
            <>
              {/* Bridge Amount Input - Only show when connected and has tokens */}
              <div className="rounded-[12px] p-4 space-y-2 border border-[#2222220d]">
                <p className="text-[#131313a1]">Bridge Amount</p>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Input
                      autoComplete="off"
                      type="number"
                      step="any"
                      min="0"
                      {...register("amount", {
                        required: "This field is required.",
                        validate: (v) => {
                          if (Number.isNaN(Number(v)) || Number(v) < 0) {
                            return "Amount must be greater than 0.";
                          }
                          if (selectedToken && Number(v) > 0) {
                            const amountInWei = BigInt(Math.floor(Number(v) * 10 ** selectedToken.decimals));
                            if (amountInWei > selectedTokenBalance) {
                              return "Amount exceeds your balance.";
                            }
                          }
                          return true;
                        },
                      })}
                      className="w-full p-0 h-auto text-[24px] !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-0 focus:outline-transparent focus:ring-0 focus:border-0"
                      placeholder="0"
                      useFormReturn={useFormReturn}
                      errorClassName="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <div className="ml-4">
                    {selectedToken && tokensWithBalance && tokensWithBalance.length > 0 && (
                      <CollateralDropdown
                        selectedCollateral={selectedToken}
                        setSelectedCollateral={handleTokenSelection}
                        collateralTokens={tokensWithBalance}
                        showChainLogo={true}
                      />
                    )}
                  </div>
                </div>
                {selectedToken && (
                  <div className="flex justify-between items-center">
                    <div className="text-[14px] text-[#131313a1]">
                      {bridgeQuote?.quote.estimate?.fromAmountUSD && amount && (
                        <>≈ ${Number(bridgeQuote.quote.estimate.fromAmountUSD).toFixed(2)} USD</>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[14px] text-[#131313a1]">
                        Balance: {displayBalance(selectedTokenBalance, selectedToken.decimals)} {selectedToken.symbol} (
                        {chains.find((chain) => chain.id === selectedToken.chainId)?.name})
                      </p>
                      <button
                        type="button"
                        className="text-[14px] font-semibold text-[#131313a1] rounded-[12px] border border-[#2222220d] py-1 px-[6px] bg-[#f9f9f9] hover:bg-[#f2f2f2]"
                        onClick={() => {
                          setValue("amount", formatUnits(selectedTokenBalance, selectedToken.decimals), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quote Information */}
              {bridgeQuote && !isQuoteLoading && (
                <div className="rounded-[12px] p-4 space-y-2 border border-[#2222220d] bg-gray-50">
                  <p className="text-[#131313a1]">You will receive</p>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-[24px] text-[#131313]">
                        {bridgeQuote.quote.estimate?.toAmountMin
                          ? displayBalance(BigInt(bridgeQuote.quote.estimate.toAmountMin), destinationToken.decimals)
                          : "0"}
                      </div>
                      {bridgeQuote.quote.estimate?.toAmountUSD && (
                        <div className="text-sm text-[#131313a1]">
                          ≈ ${Number(bridgeQuote.quote.estimate.toAmountUSD).toFixed(2)} USD
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <TokenImage token={destinationToken} />
                    </div>
                  </div>
                  <div className="flex">
                    <div className="text-sm text-[#131313a1]">
                      Using {bridgeQuote.quote.toolDetails?.name || "bridge"} in{" "}
                      {bridgeQuote.quote.estimate?.executionDuration || "~"} minutes
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Error */}
              {quoteError && (
                <Alert type="error">{quoteError.message || "Failed to get bridge quote. Please try again."}</Alert>
              )}

              {/* Bridge Execution Error */}
              {executeBridgeMutation.error && (
                <Alert type="error">
                  {executeBridgeMutation.error.message || "Failed to execute bridge. Please try again."}
                </Alert>
              )}

              {/* Execution Status */}
              {executionStatus && (
                <div className="rounded-[12px] p-4 space-y-3 border border-[#2222220d] bg-blue-50">
                  {/* Process Steps */}
                  {executionStatus.processes.length > 0 && (
                    <div className="space-y-2">
                      <div className="space-y-2">
                        {executionStatus.processes.map((process, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded bg-gray-50">
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                              {process.status === "DONE" ? (
                                <div className="text-success-primary">
                                  <CheckCircleIcon width="20" height="20" />
                                </div>
                              ) : process.status === "ACTION_REQUIRED" ? (
                                <div className="text-warning-primary">
                                  <ExclamationCircleIcon width="20" height="20" />
                                </div>
                              ) : process.status === "FAILED" ? (
                                <div className="text-error-primary">
                                  <CloseCircleOutlineIcon width="20" height="20" />
                                </div>
                              ) : (
                                <div className="text-purple-primary">
                                  <InfoCircleIcon width="20" height="20" />
                                </div>
                              )}
                            </div>

                            {/* Process Info */}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{process.message}</p>
                            </div>

                            {/* Transaction Link */}
                            {process.txLink && (
                              <div className="flex-shrink-0">
                                <a
                                  href={process.txLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline font-mono"
                                >
                                  View TX
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bridge Button */}
              <Button
                variant="primary"
                type="submit"
                className="w-full"
                disabled={Boolean(
                  !isValid ||
                    !selectedToken ||
                    !amount ||
                    isQuoteLoading ||
                    !!quoteError ||
                    executeBridgeMutation.isPending ||
                    executionStatus?.stepStatus === "ACTION_REQUIRED" ||
                    executionStatus?.stepStatus === "PENDING" ||
                    (selectedToken &&
                      amount &&
                      Number(amount) > 0 &&
                      selectedTokenBalance < BigInt(Math.floor(Number(amount) * 10 ** selectedToken.decimals))),
                )}
                text={
                  executionStatus?.stepStatus === "ACTION_REQUIRED" || executionStatus?.stepStatus === "PENDING"
                    ? "Executing..."
                    : executeBridgeMutation.isPending
                      ? "Executing bridge..."
                      : isQuoteLoading
                        ? "Getting quote..."
                        : "Bridge tokens"
                }
              />
            </>
          )}
        </form>

        {/* Return button - Always visible */}
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={() => {
              setExecutionStatus(null);
              closeBridgeModal();
            }}
            text="Return"
            className="px-8"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <CustomWagmiProvider>
        <BridgeModal title="Bridge tokens from other networks" content={renderBridgeForm()} />
      </CustomWagmiProvider>
      <button type="button" onClick={openBridgeModal} className="text-purple-primary hover:underline text-[14px]">
        Low balance? Bridge tokens from other networks
      </button>
    </>
  );
}
