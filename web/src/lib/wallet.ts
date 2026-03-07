import { config } from "@/wagmi";
import { SupportedChain } from "@seer-pm/sdk";
import { getAccount } from "@wagmi/core";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Address } from "viem";

export function checkWalletConnectCallback(
  callback: (address: Address, chainId: SupportedChain) => void,
  timeout = 1000,
) {
  const account = getAccount(config);
  if (account.address && account.chainId && account.isConnected) {
    callback(account.address, account.chainId as SupportedChain);
    return;
  }
  const { open } = useWeb3Modal();
  open({ view: "Connect" });
  const interval = setInterval(() => {
    const account = getAccount(config);
    if (account.address && account.chainId && account.isConnected) {
      callback(account.address, account.chainId as SupportedChain);
      clearInterval(interval);
    }
  }, timeout);
}
