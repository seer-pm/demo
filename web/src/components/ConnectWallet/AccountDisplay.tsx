import React from "react";
import Identicon from "react-identicons";
import { Address, formatUnits, isAddress } from "viem";
import { useAccount, useEnsAvatar, useEnsName } from "wagmi";
import { useERC20Balance } from "../../hooks/useERC20Balance";
import { useMarketFactory } from "../../hooks/useMarketFactory";
import { displayBalance, isUndefined, shortenAddress } from "../../lib/utils";

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
    name,
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

export const CollateralBalance: React.FC<{ address?: Address }> = ({ address: propAddress }) => {
  const { address: defaultAddress, chainId } = useAccount();
  const address = propAddress || defaultAddress;
  const { data: marketFactory } = useMarketFactory(chainId);
  const { data: balance } = useERC20Balance(address, marketFactory?.collateralToken);

  if (isUndefined(balance)) {
    return null;
  }

  return <div>${displayBalance(balance, marketFactory?.collateralDecimals!)}</div>;
};

const AccountDisplay: React.FC = () => {
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
        <CollateralBalance />
      </div>
    </div>
  );
};

export default AccountDisplay;
