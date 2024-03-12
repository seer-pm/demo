import { queryClient } from "@/lib/query-client";
import { toastify } from "@/lib/toastify";
import { config } from "@/wagmi";
import { OrderBookApi, OrderParameters, OrderSigningUtils, SigningScheme } from "@cowprotocol/cow-sdk";
import { useMutation } from "@tanstack/react-query";
import { getConnectorClient } from "@wagmi/core";
import { providers } from "ethers";
import { Account, Address, Chain, Client, Hex, Transport } from "viem";

interface SwapTokensProps {
  account: Address;
  chainId: number;
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
  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);

  const orderSigningResult = await OrderSigningUtils.signOrder({ ...quote, receiver: account }, chainId, signer);

  const orderBookApi = new OrderBookApi({ chainId });

  const result = await toastify(
    () =>
      orderBookApi.sendOrder({
        ...quote,
        signature: orderSigningResult.signature,
        signingScheme: orderSigningResult.signingScheme as string as SigningScheme,
      }),
    {
      txSent: { title: "Executing swap..." },
      txSuccess: { title: "Tokens swapped!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
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
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      queryClient.invalidateQueries({ queryKey: ["useERC20Balance"] });
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      onSuccess(data);
    },
  });
};
