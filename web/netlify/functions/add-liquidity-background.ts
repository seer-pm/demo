import { isTwoStringsEqual } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS } from "@seer-pm/sdk/collateral";
import { fetchMarket } from "@seer-pm/sdk/markets-fetch";
import { type PrivateKeyAccount, erc20Abi, zeroAddress } from "viem";
import { type Address, privateKeyToAccount } from "viem/accounts";
import { readContract, writeContract } from "viem/actions";
import { LiquidityManagerAbi } from "./utils/abis/LiquidityManagerAbi";
import { SDaiAdapterAbi } from "./utils/abis/SDaiAdapterAbi";
import { S_DAI_ADAPTER, liquidityManagerAddressMapping } from "./utils/common";
import { getPublicClientByChainId, getWalletClientForNetwork } from "./utils/config";
import { convertFromSDAI } from "./utils/sdai";
import { waitForContractWrite } from "./utils/waitForContractWrite";

export default async (req: Request) => {
  const [chainIdString, marketId] = req.url.replace(/\/$/, "").split("/").slice(-2);
  const chainId = Number(chainIdString) as SupportedChain;
  if (chainId !== 100) {
    return;
  }
  const market = await fetchMarket(chainId, marketId as Address);

  if (!market) {
    return;
  }

  if (!isTwoStringsEqual(market.parentMarket.id, zeroAddress)) {
    console.log("skip conditional market ", marketId);
    return;
  }

  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);
  const publicClient = getPublicClientByChainId(chainId);
  const walletClient = getWalletClientForNetwork(account, chainId);
  const liquidityAmount = BigInt(0.01 * 1e18);
  const totalLiquidityAmount = liquidityAmount * 2n * BigInt(market.wrappedTokens.length - 1);
  const currentSDaiBalance = await readContract(publicClient, {
    address: COLLATERAL_TOKENS[chainId].primary.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log({ currentSDaiBalance, totalLiquidityAmount });
  if (currentSDaiBalance < totalLiquidityAmount) {
    console.log("transferring xdai to sdai");
    // xDAI to sDAI
    await waitForContractWrite(
      async () =>
        writeContract(walletClient, {
          account,
          address: S_DAI_ADAPTER,
          abi: SDaiAdapterAbi,
          functionName: "depositXDAI",
          args: [account.address],
          value: await convertFromSDAI(chainId, ((totalLiquidityAmount - currentSDaiBalance) * 1050n) / 1000n), // convert a bit more than required to prevent slippage
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
  await writeContract(walletClient, {
    account,
    address: liquidityManagerAddressMapping[chainId]!,
    abi: LiquidityManagerAbi,
    functionName: "addIndexLiquidityToMarket",
    args: [marketId, liquidityAmount],
  });
  console.log("add index liquidity successfully to market:", {
    marketName: market.marketName,
    marketId: market.id,
  });
  return;
};

async function checkAllowanceAndApprove(
  chainId: SupportedChain,
  token: Address,
  ownerAccount: PrivateKeyAccount,
  spender: Address,
  amount: bigint,
) {
  const publicClient = getPublicClientByChainId(chainId);
  const walletClient = getWalletClientForNetwork(ownerAccount, chainId);
  const currentTokenAllowance = await readContract(publicClient, {
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [ownerAccount.address, spender],
  });
  if (currentTokenAllowance < amount) {
    console.log("approving");
    await waitForContractWrite(
      () =>
        writeContract(walletClient, {
          address: token,
          account: ownerAccount,
          abi: erc20Abi,
          functionName: "approve",
          args: [spender, amount],
        }),
      chainId,
    );
  }
}
