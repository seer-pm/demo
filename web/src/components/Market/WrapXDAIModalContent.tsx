import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWrapXDAI } from "@/hooks/useWrapXDAI";
import { ChainId, XDAI } from "@swapr/sdk";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import Button from "../Form/Button";
import Input from "../Form/Input";

interface WrapXDAIModalContentProps {
  closeModal: () => void;
  chainId: ChainId;
}

export function WrapXDAIModalContent({ closeModal, chainId }: WrapXDAIModalContentProps) {
  const wrapXDAI = useWrapXDAI(() => {
    closeModal();
  });
  const { address: account } = useAccount();
  const useFormReturn = useForm<{
    amount: string;
  }>({
    mode: "all",
    defaultValues: {
      amount: "0",
    },
  });
  const onSubmit = ({ amount }: { amount: string }) =>
    wrapXDAI.mutateAsync({ amount: parseUnits(amount, XDAI.decimals), chainId });
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useFormReturn;
  const { data: balance = BigInt(0) } = useTokenBalance(account, XDAI.address as `0x${string}`);
  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        return handleSubmit(onSubmit)(e);
      }}
    >
      <p className="mb-2">Enter xDAI amount</p>
      <Input
        autoComplete="off"
        type="number"
        step="any"
        min="0"
        {...register("amount", {
          required: "This field is required.",
          validate: (v) => {
            if (Number.isNaN(Number(v)) || Number(v) <= 0) {
              return "Amount must be greater than 0.";
            }

            const val = parseUnits(v, XDAI.decimals);
            if (val > balance) {
              return "Not enough balance.";
            }

            return true;
          },
        })}
        className="w-full"
        useFormReturn={useFormReturn}
      />
      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button variant="primary" type="submit" isLoading={wrapXDAI.isPending} text="Wrap" disabled={!isValid} />
      </div>
    </form>
  );
}
