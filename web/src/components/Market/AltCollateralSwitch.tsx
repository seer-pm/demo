import { COLLATERAL_TOKENS } from "@/lib/config";
import { isUndefined } from "@/lib/utils";
import React from "react";
import Toggle from "../Form/Toggle";

type AltCollateralSwitchProps = {
  chainId: number;
  useWrappedToken?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

const AltCollateralSwitch = React.forwardRef<HTMLInputElement | null, AltCollateralSwitchProps>((props, ref) => {
  const { chainId, useWrappedToken = false, ...toggleProps } = props;

  if (isUndefined(COLLATERAL_TOKENS[chainId].secondary)) {
    return null;
  }

  const secondary = !useWrappedToken
    ? COLLATERAL_TOKENS[chainId].secondary
    : COLLATERAL_TOKENS[chainId].secondary?.wrapped || COLLATERAL_TOKENS[chainId].secondary;

  return (
    <div className="flex space-x-2">
      <div>sDAI</div>
      <Toggle {...toggleProps} ref={ref} />
      <div>{secondary!.symbol}</div>
    </div>
  );
});

export default AltCollateralSwitch;
