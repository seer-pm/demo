import { COLLATERAL_TOKENS } from "@/lib/config";
import { isUndefined } from "@/lib/utils";
import React from "react";
import Toggle from "../Form/Toggle";

type AltCollateralSwitchProps = {
  chainId: number;
} & React.InputHTMLAttributes<HTMLInputElement>;

const AltCollateralSwitch = React.forwardRef<HTMLInputElement | null, AltCollateralSwitchProps>((props, ref) => {
  const { chainId, ...toggleProps } = props;

  if (isUndefined(COLLATERAL_TOKENS[chainId].secondary)) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      <div>sDAI</div>
      <Toggle {...toggleProps} ref={ref} />
      <div>{COLLATERAL_TOKENS[chainId].secondary!.symbol}</div>
    </div>
  );
});

export default AltCollateralSwitch;
