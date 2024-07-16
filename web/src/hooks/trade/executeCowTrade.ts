import { toastify } from "@/lib/toastify";
import { config } from "@/wagmi";
import { CoWTrade } from "@swapr/sdk";
import { getConnectorClient } from "@wagmi/core";
import { providers } from "ethers";
import { Account, Chain, Client, Transport } from "viem";

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

export async function executeCoWTrade(trade: CoWTrade): Promise<string> {
  const client = await getConnectorClient(config);
  const signer = clientToSigner(client);

  await trade.signOrder(signer, trade.order.receiver);

  const result = await toastify(() => trade.submitOrder(), {
    txSent: { title: "Confirm order..." },
    txSuccess: { title: "Order placed!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.data;
}
