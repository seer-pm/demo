import { tradeManagerAbi, tradeManagerAddress } from "@/hooks/contracts/generated-trade-manager";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { UnsignedTransaction } from "@ethersproject/transactions";
import {
  ChainId,
  CurrencyAmount,
  Fraction,
  ONE,
  Percent,
  Price,
  TokenAmount,
  TradeOptions,
  TradeType,
  TradeWithSwapTransaction,
} from "@swapr/sdk";
import { getAccount } from "@wagmi/core";
import { Address, encodeFunctionData } from "viem";
import { gnosis } from "viem/chains";
import { TradeManagerTokenPath } from "./useTradeQuoter";

export interface TradeManagerTradeParams {
  inputAmount: CurrencyAmount;
  outputAmount: CurrencyAmount;
  chainId: ChainId;
  maximumSlippage: Percent;
  paths: TradeManagerTokenPath[];
  amountOut: bigint;
}

/**
 * Trade class for TradeManager trades (conditional markets).
 * Extends TradeWithSwapTransaction to be compatible with existing Trade components.
 * Execution is handled via swapTransaction method, similar to other Trade classes.
 */
export class TradeManagerTrade extends TradeWithSwapTransaction {
  readonly paths: TradeManagerTokenPath[];
  readonly amountOut: bigint;

  constructor({ inputAmount, outputAmount, chainId, maximumSlippage, paths, amountOut }: TradeManagerTradeParams) {
    // Calculate execution price from input and output amounts
    const executionPrice = new Price({
      baseCurrency: inputAmount.currency,
      quoteCurrency: outputAmount.currency,
      denominator: inputAmount.raw,
      numerator: outputAmount.raw,
    });

    // Get the TradeManager address for this chain
    const tradeManagerAddr = tradeManagerAddress[chainId as keyof typeof tradeManagerAddress];
    if (!tradeManagerAddr) {
      throw new Error(`TradeManager address not found for chain ${chainId}`);
    }

    super({
      details: undefined, // TradeManager doesn't use route details
      type: TradeType.EXACT_INPUT, // TradeManager always uses exact input
      inputAmount,
      outputAmount,
      executionPrice,
      maximumSlippage,
      priceImpact: new Percent("0", "100"), // No price impact calculation for TradeManager
      chainId,
      // biome-ignore lint/suspicious/noExplicitAny: _
      platform: "TradeManager" as any, // Custom platform identifier
      fee: new Percent("0", "100"), // No fee for TradeManager
      approveAddress: tradeManagerAddr,
    });

    this.paths = paths;
    this.amountOut = amountOut;
  }

  minimumAmountOut(): CurrencyAmount {
    // Calculate minimum amount out based on maximum slippage
    // Formula: outputAmount / (1 + maximumSlippage)
    const slippageAdjustedAmountOut = new Fraction(ONE)
      .add(this.maximumSlippage)
      .invert()
      .multiply(this.outputAmount.raw).quotient;

    return this.outputAmount instanceof TokenAmount
      ? new TokenAmount(this.outputAmount.token, slippageAdjustedAmountOut)
      : CurrencyAmount.nativeCurrency(slippageAdjustedAmountOut, this.chainId);
  }

  maximumAmountIn(): CurrencyAmount {
    // For exact input trades, maximum amount in equals input amount
    return this.inputAmount;
  }

  async swapTransaction(options: TradeOptions): Promise<UnsignedTransaction> {
    if (!this.paths.length) {
      throw new Error("Cannot swap! No paths available.");
    }

    // TODO: Remove this check once TradeManager is deployed on all chains
    if (this.chainId !== gnosis.id) {
      throw new Error(
        `TradeManager is not yet supported on chain ${this.chainId}. Only Gnosis (${gnosis.id}) is currently supported.`,
      );
    }

    const { address } = getAccount(config);
    if (!address) {
      throw new Error("Account not found!");
    }

    const amountIn = BigInt(this.inputAmount.raw.toString());
    const amountOutMinimum = BigInt(this.minimumAmountOut().raw.toString());
    const isUseNativeToken = isTwoStringsEqual(this.inputAmount.currency.address || "", NATIVE_TOKEN);

    // Get the TradeManager address for the current chain
    const tradeManagerAddr = tradeManagerAddress[this.chainId as keyof typeof tradeManagerAddress];
    if (!tradeManagerAddr) {
      throw new Error(`TradeManager address not found for chain ${this.chainId}`);
    }

    // Encode the function data
    const data = encodeFunctionData({
      abi: tradeManagerAbi,
      functionName: "exactInput",
      args: [
        // biome-ignore lint/suspicious/noExplicitAny:
        this.paths as any,
        {
          recipient: (options.recipient as Address) || address,
          originalRecipient: (options.recipient as Address) || address,
          deadline: BigInt(Math.floor(new Date().getTime() / 1000) + 3600),
          amountIn: isUseNativeToken ? 0n : amountIn,
          amountOutMinimum,
        },
      ],
    });

    // Convert to UnsignedTransaction format
    return {
      to: tradeManagerAddr,
      data,
      value: isUseNativeToken ? `0x${amountIn.toString(16)}` : "0x0",
      gasLimit: undefined,
      gasPrice: undefined,
      nonce: undefined,
    } as UnsignedTransaction;
  }
}
