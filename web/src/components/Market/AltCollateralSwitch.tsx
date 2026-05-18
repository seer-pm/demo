import { isUndefined } from "@/lib/utils";
import { useTokensInfo } from "@seer-pm/react";
import { Market, getActiveCollateralProfile } from "@seer-pm/sdk";
import React from "react";
import { Address, zeroAddress } from "viem";
import Toggle from "../Form/Toggle";

type AltCollateralSwitchProps = {
  market: Market;
  isUseWrappedToken?: boolean;
  collateralPair?: [Address, Address];
} & React.InputHTMLAttributes<HTMLInputElement>;

function getCollateralPair(market: Market, isUseWrappedToken: boolean): [Address, Address] | [] {
  if (market.type === "Futarchy") {
    return [market.collateralToken1, market.collateralToken2];
  }

  const profile = getActiveCollateralProfile(market.chainId);
  if (isUndefined(profile.secondary)) {
    return [];
  }

  const secondary = isUseWrappedToken ? profile.secondary?.wrapped || profile.secondary : profile.secondary;

  if (!secondary) {
    return [];
  }

  return [profile.primary.address, secondary.address];
}

const AltCollateralSwitch = React.forwardRef<HTMLInputElement | null, AltCollateralSwitchProps>((props, ref) => {
  const { market, collateralPair, isUseWrappedToken = false, ...toggleProps } = props;

  const { data: collateralTokens } = useTokensInfo(
    collateralPair || getCollateralPair(market, isUseWrappedToken),
    market.chainId,
  );

  if (market.parentMarket.id !== zeroAddress || !collateralTokens || collateralTokens.length === 0) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      <div>{collateralTokens[0].symbol}</div>
      <Toggle {...toggleProps} ref={ref} />
      <div>{collateralTokens[1].symbol}</div>
    </div>
  );
});

export default AltCollateralSwitch;
