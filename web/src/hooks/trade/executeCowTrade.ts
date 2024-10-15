import { pollForOrder } from "@/components/SwapUpdater";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastify } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { CoWTrade, WXDAI } from "@swapr/sdk";
import { getConnectorClient } from "@wagmi/core";
import { providers } from "ethers";
import { Account, Address, Chain, Client, Transport, parseUnits } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { approveTokens } from "../useApproveTokens";
import { fetchNeededApprovals } from "../useMissingApprovals";
import {
  S_DAI_ADAPTER,
  depositFromNativeToSDAI,
  depositToSDAI,
  redeemFromSDAI,
  redeemFromSDAIToNative,
} from "./handleSDAI";
import { getConvertedShares, setCowTradeLimit } from "./utils";

function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

async function getPopulatedTransaction(trade: CoWTrade, account: Address, collateral: Token, originalAmount: string) {
  const sDAIAddress = COLLATERAL_TOKENS[trade.chainId].primary.address;
  const DAIAddress = COLLATERAL_TOKENS[trade.chainId].secondary?.address;
  const wxDAIAddress = WXDAI[trade.chainId].address as Address;
  const isBuyOutcomeTokens = isTwoStringsEqual(trade.inputAmount.currency.address, sDAIAddress);
  // mainnet: dai to sdai
  if (
    trade.chainId === mainnet.id &&
    isBuyOutcomeTokens &&
    DAIAddress &&
    isTwoStringsEqual(collateral.address, DAIAddress)
  ) {
    const amount = parseUnits(originalAmount, collateral.decimals);
    const missingApprovals = await fetchNeededApprovals([DAIAddress], account, sDAIAddress, [amount]);
    if (missingApprovals.length > 0) {
      await approveTokens({
        amount,
        tokenAddress: DAIAddress,
        spender: sDAIAddress,
      });
    }
    const receipt = await depositToSDAI({ amount, chainId: trade.chainId, owner: account });
    const shares = getConvertedShares(receipt);
    if (shares) {
      const newTrade = await setCowTradeLimit(trade, shares, account);
      return newTrade;
    }
  }

  // gnosis: xdai to sdai
  if (trade.chainId && gnosis.id && isBuyOutcomeTokens && isTwoStringsEqual(collateral.address, NATIVE_TOKEN)) {
    console.log("here");
    const amount = parseUnits(originalAmount, collateral.decimals);
    const receipt = await depositFromNativeToSDAI({ amount, chainId: trade.chainId, owner: account });
    const shares = getConvertedShares(receipt);
    if (shares) {
      const newTrade = await setCowTradeLimit(trade, shares, account);
      return newTrade;
    }
  }

  // gnosis: wxdai to sdai
  if (isBuyOutcomeTokens && isTwoStringsEqual(collateral.address, wxDAIAddress)) {
    const amount = parseUnits(originalAmount, collateral.decimals);
    const missingApprovals = await fetchNeededApprovals([wxDAIAddress], account, sDAIAddress, [amount]);
    if (missingApprovals.length > 0) {
      await approveTokens({
        amount,
        tokenAddress: wxDAIAddress,
        spender: sDAIAddress,
      });
    }
    const receipt = await depositToSDAI({ amount, chainId: trade.chainId, owner: account });
    const shares = getConvertedShares(receipt);
    if (shares) {
      const newTrade = await setCowTradeLimit(trade, shares, account);
      return newTrade;
    }
  }

  return trade;
}

export async function executeCoWTrade(
  trade: CoWTrade,
  account: Address,
  collateral: Token,
  originalAmount: string,
): Promise<string> {
  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);

  const newTrade = await getPopulatedTransaction(trade, account, collateral, originalAmount);

  await newTrade.signOrder(signer, newTrade.order.receiver);

  const result = await toastify(() => newTrade.submitOrder(), {
    txSent: { title: "Confirm order..." },
    txSuccess: { title: "Order placed!" },
  });

  if (!result.status) {
    throw result.error;
  }

  const orderId = result.data;

  const orderResult = await pollForOrder(orderId, newTrade.chainId);

  if (orderResult.error) {
    throw orderResult.error;
  }

  const sDAIAddress = COLLATERAL_TOKENS[newTrade.chainId].primary.address;
  const wxDAIAddress = WXDAI[newTrade.chainId].address as Address;
  const DAIAddress = COLLATERAL_TOKENS[newTrade.chainId].secondary?.address;

  const isSellOutcomeTokens = isTwoStringsEqual(newTrade.outputAmount.currency.address, sDAIAddress);
  const receivedAmount = BigInt(newTrade.outputAmount.raw.toString());

  // mainnet: sdai to dai
  if (newTrade.chainId === mainnet.id && isSellOutcomeTokens && isTwoStringsEqual(collateral.address, DAIAddress)) {
    await redeemFromSDAI({
      amount: BigInt(newTrade.outputAmount.raw.toString()),
      chainId: newTrade.chainId,
      owner: account,
    });
  }

  // gnosis: sdai to xdai
  if (newTrade.chainId === gnosis.id && isSellOutcomeTokens && isTwoStringsEqual(collateral.address, NATIVE_TOKEN)) {
    const missingApprovals = await fetchNeededApprovals([sDAIAddress], account, S_DAI_ADAPTER, [receivedAmount]);
    if (missingApprovals.length > 0) {
      await approveTokens({
        amount: receivedAmount,
        tokenAddress: sDAIAddress,
        spender: S_DAI_ADAPTER,
      });
    }
    await redeemFromSDAIToNative({
      amount: receivedAmount,
      chainId: newTrade.chainId,
      owner: account,
    });
  }

  // gnosis: sdai to wxdai
  if (newTrade.chainId === gnosis.id && isSellOutcomeTokens && isTwoStringsEqual(collateral.address, wxDAIAddress)) {
    await redeemFromSDAI({
      amount: receivedAmount,
      chainId: newTrade.chainId,
      owner: account,
    });
  }

  return result.data;
}
