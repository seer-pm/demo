import { SupportedChain } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { toastify, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import {
  COW_PROTOCOL_VAULT_RELAYER_ADDRESS,
  OrderBookApi,
  OrderParameters,
  OrderSigningUtils,
  SigningScheme,
} from "@cowprotocol/cow-sdk";
import { useMutation } from "@tanstack/react-query";
import { getConnectorClient, readContract, writeContract } from "@wagmi/core";
import { providers } from "ethers";
import { Account, Address, Chain, Client, Hex, Transport, erc20Abi } from "viem";

interface SwapTokensProps {
  account: Address;
  chainId: SupportedChain;
  quote: OrderParameters;
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
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

async function swapTokens({ account, chainId, quote }: SwapTokensProps): Promise<string> {
  const vaultRelayer = COW_PROTOCOL_VAULT_RELAYER_ADDRESS[chainId] as `0x${string}`;
  const sellToken = quote.sellToken as `0x${string}`;

  const allowance = await readContract(config, {
    abi: erc20Abi,
    address: sellToken,
    functionName: "allowance",
    args: [account, vaultRelayer],
  });

  const neededAllowance = BigInt(quote.sellAmount) + BigInt(quote.feeAmount);

  if (allowance < neededAllowance) {
    const result = await toastifyTx(
      () =>
        writeContract(config, {
          address: sellToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultRelayer, neededAllowance],
        }),
      {
        txSent: { title: "Approving token..." },
        txSuccess: { title: "Token approved." },
      },
    );

    if (!result.status) {
      throw result.error;
    }
  }

  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);

  const order = {
    ...quote,
    sellAmount: (BigInt(quote.sellAmount) + BigInt(quote.feeAmount)).toString(),
    feeAmount: "0",
  };

  const orderSigningResult = await OrderSigningUtils.signOrder({ ...order, receiver: account }, chainId, signer);

  const orderBookApi = new OrderBookApi({ chainId });

  const result = await toastify(
    () =>
      orderBookApi.sendOrder({
        ...order,
        signature: orderSigningResult.signature,
        signingScheme: orderSigningResult.signingScheme as string as SigningScheme,
      }),
    {
      txSent: { title: "Confirm order..." },
      txSuccess: { title: "Order placed!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.data;
}

export interface SwapConfig {
  path: Hex;
  token: Address;
  decimals: number;
  tokenAIn: boolean;
}

export const useSwapTokens = (onSuccess: (data: string) => unknown) => {
  return useMutation({
    mutationFn: swapTokens,
    onSuccess: (data: string) => {
      queryClient.invalidateQueries({ queryKey: ["useUserPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      onSuccess(data);
    },
  });
};
