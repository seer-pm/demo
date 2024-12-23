import { Market } from "@/hooks/useMarket";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { isUndefined } from "@/lib/utils";
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

  if (isUndefined(COLLATERAL_TOKENS[market.chainId].secondary)) {
    return [];
  }

  const secondary = isUseWrappedToken
    ? COLLATERAL_TOKENS[market.chainId].secondary?.wrapped || COLLATERAL_TOKENS[market.chainId].secondary
    : COLLATERAL_TOKENS[market.chainId].secondary;

  if (!secondary) {
    return [];
  }

  return [COLLATERAL_TOKENS[market.chainId].primary.address, secondary.address];
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
