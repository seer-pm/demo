import Toggle from "@/components/Form/Toggle";
import { useGlobalState } from "@/hooks/useGlobalState";
import { QuestionIcon } from "@/lib/icons";
import clsx from "clsx";

interface UseSmartAccountToggleProps {
  className?: string;
}

export function UseSmartAccountToggle({ className }: UseSmartAccountToggleProps) {
  const [useSmartAccount, setUseSmartAccount] = useGlobalState((state) => [
    state.useSmartAccount,
    state.setUseSmartAccount,
  ]);

  return (
    <div className={clsx(className, "justify-between w-full whitespace-nowrap")}>
      <div className="flex items-center gap-1">
        <span>Use smart account</span>
        <div className="tooltip">
          <p className="tooltiptext w-[200px] !whitespace-break-spaces">
            Uses the smart account for batching transactions via EIP-7702 if available
          </p>
          <QuestionIcon fill="#9747FF" />
        </div>
      </div>
      <Toggle
        className="checked:bg-purple-primary shrink-0"
        checked={useSmartAccount}
        onChange={(e) => setUseSmartAccount(e.target.checked)}
      />
    </div>
  );
}
