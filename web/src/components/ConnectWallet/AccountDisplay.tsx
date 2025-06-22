import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { displayBalance, isUndefined, shortenAddress } from "@/lib/utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import clsx from "clsx";
import React from "react";
import { Address, isAddress } from "viem";
import { useAccount, useEnsName } from "wagmi";

interface IAddressOrName {
  address?: `0x${string}`;
}

export const AddressOrName: React.FC<IAddressOrName> = ({ address: propAddress }) => {
  const { address: defaultAddress } = useAccount();
  const address = propAddress || defaultAddress;

  const { data } = useEnsName({
    address,
    chainId: 1,
  });

  if (!address) {
    return null;
  }

  return <div>{data ?? (isAddress(address) ? shortenAddress(address) : address)}</div>;
};

export const CollateralBalance: React.FC<{ chainId: SupportedChain; address?: Address }> = ({
  chainId,
  address: propAddress,
}) => {
  const { address: defaultAddress } = useAccount();
  const address = propAddress || defaultAddress;
  const { data: balance } = useTokenBalance(address, COLLATERAL_TOKENS[chainId].primary.address, chainId);

  if (isUndefined(balance)) {
    return null;
  }

  return (
    <div>
      {displayBalance(balance, COLLATERAL_TOKENS[chainId].primary.decimals)} {COLLATERAL_TOKENS[chainId].primary.symbol}
    </div>
  );
};

const AccountDisplay: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const { open } = useWeb3Modal();
  const { chain } = useAccount();
  return (
    <div
      className={clsx(
        "inline-flex gap-2 text-[14px] rounded-[300px] px-[16px] h-[32px] cursor-pointer hover:opacity-90",
        isMobile ? "bg-blue-medium text-purple-primary" : "bg-[#FFFFFF1F] text-white",
      )}
      onClick={() => open({ view: "Account" })}
    >
      <div className={clsx("gap-2 items-center", isMobile ? "flex" : "hidden xl:flex")}>
        <div className={clsx("w-[8px] h-[8px] rounded-full", chain ? "bg-success-primary" : "bg-error-primary")}></div>
      </div>
      <div className={clsx("flex space-x-2 items-center", isMobile ? "text-purple-primary" : " text-white")}>
        <AddressOrName />
      </div>
    </div>
  );
};

export default AccountDisplay;
