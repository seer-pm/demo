import { CollateralData } from "@/hooks/useCollateralsInfo";
import React from "react";
import Toggle from "../Form/Toggle";

type AltCollateralSwitchProps = {
  altCollateral: CollateralData;
} & React.InputHTMLAttributes<HTMLInputElement>;

const AltCollateralSwitch = React.forwardRef<HTMLInputElement | null, AltCollateralSwitchProps>((props, ref) => {
  const { altCollateral, ...toggleProps } = props;
  return (
    <div className="flex space-x-2">
      <div>sDAI</div>
      <Toggle {...toggleProps} ref={ref} />
      <div>{altCollateral.symbol}</div>
    </div>
  );
});

export default AltCollateralSwitch;
