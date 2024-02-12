import { UseFormRegister } from "react-hook-form";
import { MergeFormValues } from "./MergeForm";
import { SplitFormValues } from "./SplitForm";

export function AltCollateralSwitch({ register }: { register: UseFormRegister<MergeFormValues | SplitFormValues> }) {
  return (
    <div className="flex space-x-2">
      <div>sDAI</div>
      <input type="checkbox" className="toggle toggle-md" {...register("useAltCollateral")} />
      <div>DAI</div>
    </div>
  );
}
