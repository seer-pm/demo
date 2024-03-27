import { useTokenBalance } from "@/hooks/useTokenBalance";
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

export const ChainDisplay: React.FC = () => {
  const { chain } = useAccount();

  return (
    <div className="flex space-x-2 items-center">
      <div className={clsx("w-[8px] h-[8px] rounded-full", chain ? "bg-success-primary" : "bg-error-primary")}></div>
      <div>{chain?.name}</div>
    </div>
  );
};

export const CollateralBalance: React.FC<{ chainId: number; address?: Address }> = ({
  chainId,
  address: propAddress,
}) => {
  const { address: defaultAddress } = useAccount();
  const address = propAddress || defaultAddress;
  const { data: balance } = useTokenBalance(address, COLLATERAL_TOKENS[chainId].primary.address);

  if (isUndefined(balance)) {
    return null;
  }

  return (
    <div>
      {displayBalance(balance, COLLATERAL_TOKENS[chainId].primary.decimals)} {COLLATERAL_TOKENS[chainId].primary.symbol}
    </div>
  );
};

const AccountDisplay: React.FC<{ chainId: number }> = ({ chainId: _chainId }) => {
  const { open } = useWeb3Modal();
  return (
    <div
      className="flex space-x-2 text-[14px] bg-blue-light text-black rounded-[300px] px-[16px] py-[5px] cursor-pointer"
      onClick={() => open({ view: "Account" })}
    >
      <div>
        <ChainDisplay />
      </div>
      <div className="flex space-x-2 items-center text-black-secondary">
        <AddressOrName />
      </div>
      {/*<div>
        <CollateralBalance chainId={chainId} />
  </div>*/}
    </div>
  );
};

export default AccountDisplay;
