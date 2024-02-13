import React from "react";
import Toggle from "../Form/Toggle";

const AltCollateralSwitch = React.forwardRef<HTMLInputElement | null, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    return (
      <div className="flex space-x-2">
        <div>sDAI</div>
        <Toggle {...props} ref={ref} />
        <div>DAI</div>
      </div>
    );
  },
);

export default AltCollateralSwitch;
