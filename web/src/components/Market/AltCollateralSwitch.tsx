import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { isUndefined } from "@/lib/utils";
import React from "react";
import Toggle from "../Form/Toggle";

type AltCollateralSwitchProps = {
  chainId: SupportedChain;
  isUseWrappedToken?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

const AltCollateralSwitch = React.forwardRef<HTMLInputElement | null, AltCollateralSwitchProps>((props, ref) => {
  const { chainId, isUseWrappedToken = false, ...toggleProps } = props;

  if (isUndefined(COLLATERAL_TOKENS[chainId].secondary)) {
    return null;
  }

  const secondary = isUseWrappedToken
    ? COLLATERAL_TOKENS[chainId].secondary?.wrapped || COLLATERAL_TOKENS[chainId].secondary
    : COLLATERAL_TOKENS[chainId].secondary;
  return (
    <div className="flex space-x-2">
      <div>sDAI</div>
      <Toggle {...toggleProps} ref={ref} />
      <div>{secondary!.symbol}</div>
    </div>
  );
});

export default AltCollateralSwitch;
