import { useTokenBalance } from "@/hooks/useTokenBalance";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { displayBalance, isUndefined, shortenAddress } from "@/lib/utils";
import React from "react";
import Identicon from "react-identicons";
import { Address, isAddress } from "viem";
import { useAccount, useEnsAvatar, useEnsName } from "wagmi";

interface IIdenticonOrAvatar {
  size?: `${number}`;
  address?: `0x${string}`;
}

export const IdenticonOrAvatar: React.FC<IIdenticonOrAvatar> = ({ size = "16", address: propAddress }) => {
  const { address: defaultAddress } = useAccount();
  const address = propAddress || defaultAddress;

  const { data: name } = useEnsName({
    address,
    chainId: 1,
  });
  const { data: avatar } = useEnsAvatar({
    name: name || "",
    chainId: 1,
  });

  return avatar ? (
    <img src={avatar} alt="avatar" width={size} height={size} />
  ) : (
    <Identicon size={size} string={address} />
  );
};

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

  return <label>{data ?? (isAddress(address) ? shortenAddress(address) : address)}</label>;
};

export const ChainDisplay: React.FC = () => {
  const { chain } = useAccount();
  return <label>{chain?.name}</label>;
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

  return <div>{displayBalance(balance, COLLATERAL_TOKENS[chainId].primary.decimals)} sDAI</div>;
};

const AccountDisplay: React.FC<{ chainId: number }> = ({ chainId }) => {
  return (
    <div className="flex space-x-2">
      <div className="flex space-x-2 items-center">
        <IdenticonOrAvatar size="20" />
        <AddressOrName />
      </div>
      <div>
        <ChainDisplay />
      </div>
      <div>
        <CollateralBalance chainId={chainId} />
      </div>
    </div>
  );
};

export default AccountDisplay;
