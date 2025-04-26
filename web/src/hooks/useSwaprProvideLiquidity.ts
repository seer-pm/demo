import { Market } from "@/hooks/useMarket";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { LiquidityFormData, OutcomeFormData, isValidLiquidityOutcome } from "@/lib/liquidity";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config as wagmiConfig } from "@/wagmi";
import {
  // Reverted import path, assuming Token/FeeAmount are top-level or re-exported
  FeeAmount,
  MintCallParams,
  Percent,
  PoolDataResult,
  Price,
  Token,
  V3_CONTRACTS,
  fetchAndGetMintCallParameters,
  getPoolData,
  // Add other necessary SDK imports (e.g., Price, SqrtPriceMath)
} from "@algebra/sdk"; // Reverted import path
import { useMutation, useQuery } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core"; // Import for sending transactions
import { http, Address, Hex, TransactionReceipt, createPublicClient } from "viem";
import { parseUnits } from "viem"; // Import parseUnits
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi"; // Import useAccount to get the recipient address

export const SLIPPAGE_TOLERANCE = new Percent(50, 10000); // Slippage tolerance 0.5% (50 BPS)
export const USE_FULL_PRECISION = true;

const NonfungiblePositionManagerAbi = [
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "multicall",
    outputs: [
      {
        internalType: "bytes[]",
        name: "results",
        type: "bytes[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

/**
 * Builds a Price object for token pair with proper decimal handling
 */
export function buildPrice(token0: Token, token1: Token, priceValue: number): Price<Token, Token> {
  const priceDenominator = parseUnits("1", token0.decimals).toString();
  const priceNumerator = parseUnits(priceValue.toFixed(Math.min(18, token1.decimals)), token1.decimals).toString();

  return new Price(token0, token1, priceDenominator, priceNumerator);
}

// --- Hoisted Types ---

interface ProvideLiquidityProps {
  formData: LiquidityFormData["outcomes"];
  market: Market;
  // recipient: Address; // Removed recipient, will get from useAccount within prepareMint
}

// Minimal PrepareMintResult: original fields
export interface PrepareMintResult {
  calldatas: Hex[]; // Assuming Hex is `0x${string}`
  mintArgs: MintCallParams[];
}

// --- Preparation Logic ---

const publicClient = createPublicClient({
  chain: gnosis,
  transport: http(),
});

// Returns calldatas or throws an error
// Added recipient address retrieval via useAccount inside the function body or hook
async function prepareMint(props: ProvideLiquidityProps, recipient: Address | undefined): Promise<PrepareMintResult> {
  const { formData, market } = props;
  const calldatas: Hex[] = [];
  const mintArgs: MintCallParams[] = [];

  if (!recipient) {
    throw new Error("Recipient address is required but not provided.");
  }

  if (market.chainId !== gnosis.id) {
    throw new Error(`Chain ID mismatch: Expected ${gnosis.id}, got ${market.chainId}`);
  }

  const sDaiData = COLLATERAL_TOKENS[market.chainId].primary;
  const sDaiToken = new Token(market.chainId, sDaiData.address as Address, sDaiData.decimals, sDaiData.symbol);

  const outcomeTokens = market.wrappedTokens.map(
    (address: Address, i) => new Token(market.chainId, address, 18, `OUTCOME_${i}`),
  );

  // Upfront check for data consistency
  if (outcomeTokens.length !== formData.length) {
    throw new Error("Mismatch between outcome token count and form data count.");
  }

  for (let index = 0; index < formData.length; index++) {
    const config: OutcomeFormData = formData[index];

    if (!isValidLiquidityOutcome(config)) {
      continue;
    }

    const outcomeToken = outcomeTokens[index];

    const [token0, token1] = sDaiToken.sortsBefore(outcomeToken)
      ? [sDaiToken, outcomeToken]
      : [outcomeToken, sDaiToken];

    const inputToken = config.independentToken === "quote" ? sDaiToken : outcomeToken;
    const inputAmount = parseUnits(
      String(config.independentToken === "quote" ? config.quoteAmount : config.baseAmount),
      inputToken.decimals,
    ).toString();

    // No try-catch here. If any of these throw, prepareMint will fail.
    const initialPrice = buildPrice(token0, token1, config.centerPrice);
    const priceLowerObj = buildPrice(token0, token1, config.minPrice);
    const priceUpperObj = buildPrice(token0, token1, config.maxPrice);

    const { txParameters, mintArgs: mintArgsFromCall } = await fetchAndGetMintCallParameters({
      createPoolIfNecessary: true,
      publicClient,
      tokenA: token0,
      tokenB: token1,
      fee: FeeAmount.LOW,
      initialPrice,
      priceLower: priceLowerObj,
      priceUpper: priceUpperObj,
      inputToken,
      inputAmount,
      recipient: recipient,
      deadline: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes deadline
      slippageTolerance: SLIPPAGE_TOLERANCE,
      useFullPrecision: USE_FULL_PRECISION,
    });

    if (txParameters.callDatas && txParameters.callDatas.length > 0) {
      calldatas.push(...txParameters.callDatas);
      mintArgs.push(mintArgsFromCall);
    } else {
      throw new Error(`No calldata could be prepared for outcome ${index}.`);
    }
  }

  return {
    calldatas,
    mintArgs,
  };
}

// --- New Preparation Hook ---
export const usePrepareLiquidityMint = (props: ProvideLiquidityProps, enabled = true) => {
  const { address: recipient } = useAccount();

  return useQuery<PrepareMintResult, Error>({
    queryKey: ["prepareLiquidityMint", props.formData, props.market.id, recipient],
    queryFn: () => {
      if (!recipient) {
        throw new Error("Wallet not connected");
      }

      return prepareMint(props, recipient);
    },
    enabled: enabled && !!recipient,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
};

// --- Execution Logic ---

// Executes the multicall mint or throws an error
// Changed input type to accept PrepareMintResult
async function executeMint(prepareResult: PrepareMintResult): Promise<TransactionReceipt> {
  const { calldatas } = prepareResult;
  if (!calldatas || calldatas.length === 0) {
    console.log("No calldata provided to executeMint.");
    throw new Error("No liquidity positions to add.");
  }
  console.log("calldatas", calldatas);
  console.log(`Submitting multicall transaction for ${calldatas.length} outcomes...`);
  const txResult = await toastifyTx(
    () =>
      writeContract(wagmiConfig, {
        address: V3_CONTRACTS.NONFUNGIBLE_POSITION_MANAGER_ADDRESS as Address,
        abi: NonfungiblePositionManagerAbi,
        functionName: "multicall",
        args: [calldatas],
      }),
    {
      txSent: { title: `Adding Liquidity (${calldatas.length} Positions)...` },
      txSuccess: { title: `Liquidity Added (${calldatas.length} Positions)!` },
      txError: { title: "Liquidity Add Failed" },
    },
  );

  if (!txResult.status || !txResult.receipt) {
    console.error("Multicall transaction failed or receipt missing. See toast notification.");
    // Throwing a more specific error based on status
    throw new Error(
      txResult.status === false ? "Multicall transaction failed" : "Missing receipt for multicall transaction",
    );
  }

  console.log("Multicall transaction successful:", txResult.receipt);
  return txResult.receipt;
}

// --- Updated Mutation Hook ---
// Accepts PrepareMintResult instead of ProvideLiquidityProps
export const useSwaprProvideLiquidity = (
  onSuccess?: (data: TransactionReceipt) => void,
  onError?: (error: Error) => void,
) => {
  return useMutation<TransactionReceipt, Error, PrepareMintResult>({
    mutationFn: executeMint,
    onSuccess: (data) => {
      // Invalidate relevant queries upon success
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      console.log("Liquidity provided successfully via multicall (hook):", data);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      // Log errors from either preparation or execution
      console.error("Error providing liquidity (hook):", error);
      if (onError) {
        onError(error);
      }
    },
  });
};

// --- Pool Data Hook ---

interface UsePoolsDataProps {
  market: Market | undefined;
}

async function fetchPoolsDataForMarket(market: Market, client: typeof publicClient): Promise<PoolDataResult[]> {
  if (market.chainId !== gnosis.id) {
    throw new Error(`Chain ID mismatch: Expected ${gnosis.id}, got ${market.chainId}`);
  }

  const sDaiData = COLLATERAL_TOKENS[market.chainId].primary;
  const sDaiToken = new Token(market.chainId, sDaiData.address as Address, sDaiData.decimals, sDaiData.symbol);

  const outcomeTokens = market.wrappedTokens.map(
    (address: Address, i) => new Token(market.chainId, address, 18, `OUTCOME_${i}`),
  );

  return getPoolData(
    client,
    outcomeTokens.map((outcomeToken) => [sDaiToken, outcomeToken]),
  );
}

export const usePoolsData = ({ market }: UsePoolsDataProps) => {
  return useQuery<PoolDataResult[], Error>({
    queryKey: ["usePoolsData", market?.id],
    queryFn: async () => {
      if (!market) {
        throw new Error("Market is required to fetch pools data.");
      }
      // Assuming publicClient is accessible in this scope.
      // If not, it might need to be created here or passed in.
      return fetchPoolsDataForMarket(market, publicClient);
    },
    enabled: !!market, // Only run the query if market is defined
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Retry once on failure
  });
};
