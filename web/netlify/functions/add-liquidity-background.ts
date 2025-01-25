import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { readContract, writeContract } from "@wagmi/core";
import { PrivateKeyAccount, erc20Abi, zeroAddress } from "viem";
import { Address, privateKeyToAccount } from "viem/accounts";
import { LiquidityManagerAbi } from "./utils/abis/LiquidityManagerAbi";
import { SDaiAdapterAbi } from "./utils/abis/SDaiAdapterAbi";
import { waitForContractWrite } from "./utils/common";
import { config } from "./utils/config";
import { S_DAI_ADAPTER, liquidityManagerAddressMapping } from "./utils/constants";
import { fetchMarket } from "./utils/fetchMarkets";
import { convertFromSDAI } from "./utils/handleSDai";
import { isTwoStringsEqual } from "../../src/lib/utils";
import { SupportedChain } from "../../src/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const [chainIdString, marketId] = event.path
    .split("/")
    .slice(
      event.path.split("/").indexOf("add-liquidity-background") + 1,
      event.path.split("/").indexOf("add-liquidity-background") + 3,
    );
  const chainId = Number(chainIdString) as SupportedChain;
  if (chainId !== 100) {
    return {};
  }
  const market = await fetchMarket(marketId, chainId);
  const parentMarket = market.parentMarket.id;
  if (parentMarket && !isTwoStringsEqual(parentMarket, zeroAddress)) {
    console.log("skip conditional market ", marketId);
    return;
  }
  const sDAIAddress = COLLATERAL_TOKENS[chainId].primary.address;
  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);
  const liquidityAmount = BigInt(0.01 * 1e18);
  const totalLiquidityAmount = liquidityAmount * 2n * BigInt(market.wrappedTokens.length - 1);
  const currentSDaiBalance = await readContract(config, {
    address: sDAIAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
    chainId: Number(chainId) as SupportedChain,
  });
  console.log({ currentSDaiBalance, totalLiquidityAmount });
  if (currentSDaiBalance < totalLiquidityAmount) {
    console.log("transferring xdai to sdai");
    // xDAI to sDAI
    await waitForContractWrite(
      async () =>
        writeContract(config, {
          account,
          address: S_DAI_ADAPTER,
          abi: SDaiAdapterAbi,
          functionName: "depositXDAI",
          args: [account.address],
          value: await convertFromSDAI(((totalLiquidityAmount - currentSDaiBalance) * 1050n) / 1000n, chainId), //convert a bit more than required to prevent slippage
          chainId,
        }),
      chainId,
    );
  }
  await checkAllowanceAndApprove(
    chainId,
    COLLATERAL_TOKENS[chainId].primary.address,
    account,
    liquidityManagerAddressMapping[chainId]!,
    totalLiquidityAmount,
  );
  console.log("adding index liquidity");
  await writeContract(config, {
    account,
    address: liquidityManagerAddressMapping[chainId]!,
    abi: LiquidityManagerAbi,
    functionName: "addIndexLiquidityToMarket",
    args: [marketId, liquidityAmount],
    chainId: chainId,
  });
  console.log("add index liquidity successfully to market:", {
    marketName: market.marketName,
    marketId: market.id,
  });
  return {};
};

async function checkAllowanceAndApprove(
  chainId: SupportedChain,
  token: Address,
  ownerAccount: PrivateKeyAccount,
  spender: Address,
  amount: bigint,
) {
  const currentTokenAllowance = await readContract(config, {
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [ownerAccount.address, spender],
    chainId,
  });
  if (currentTokenAllowance < amount) {
    console.log("approving");
    await waitForContractWrite(
      () =>
        writeContract(config, {
          address: token,
          account: ownerAccount,
          abi: erc20Abi,
          functionName: "approve",
          args: [spender, amount],
          chainId,
        }),
      chainId,
    );
  }
}
