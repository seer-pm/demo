import Button from "@/components/Form/Button";
import { useArbitrationCost } from "@/hooks/useArbitrationCost";
import { Question } from "@/hooks/useMarket";
import { useRaiseDispute } from "@/hooks/useRaiseDispute";
import { SupportedChain } from "@/lib/chains";
import { getCurrentBond } from "@/lib/reality";
import { displayBalance, isUndefined } from "@/lib/utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { mainnet } from "viem/chains";
import { useAccount, useBalance } from "wagmi";
import { Alert } from "../Alert";

interface RaiseDisputeFormProps {
  question: Question;
  closeModal: () => void;
  chainId: SupportedChain;
}

export function RaiseDisputeForm({ question, closeModal, chainId }: RaiseDisputeFormProps) {
  const { address } = useAccount();
  const { open } = useWeb3Modal();
  const { data: balance = { value: 0n } } = useBalance({ address, chainId: mainnet.id });
  const currentBond = getCurrentBond(question.bond, question.min_bond);
  const hasEnoughBalance = balance.value > currentBond;

  const { data: arbitrationCost } = useArbitrationCost();

  const raiseDispute = useRaiseDispute((/*receipt: TransactionReceipt*/) => {});

  const onRaiseDispute = async () => {
    await raiseDispute.mutateAsync({
      questionId: question.id,
      currentBond: currentBond,
      arbitrationCost: arbitrationCost!,
      chainId: chainId! as SupportedChain,
    });

    closeModal();
  };

  if (!address) {
    return (
      <>
        <Alert type="error">Connect your wallet to raise a dispute.</Alert>;
        <div className="space-x-[24px] text-center">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
          <Button variant="primary" type="button" onClick={async () => open({ view: "Connect" })} text="Connect" />
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="text-black-secondary space-y-[24px]">
        <p>
          In order to raise a dispute, you need to deposit the arbitration fees. The fees are used to pay the jurors for
          their work.
        </p>
        <p>
          After the fees are deposited the dispute starts. A random pool of jurors is selected to evaluate the case, the
          evidence, and vote. The side that receives the majority of votes wins the dispute and receives the arbitration
          fee back.
        </p>
        <p>
          After the juror's decision, both sides can still appeal the case if not satisfied with the result. It leads to
          another round with different jurors.
        </p>
      </div>

      {!isUndefined(arbitrationCost) && (
        <div className="text-purple-primary space-y-2 my-[48px] text-center">
          <div>Arbitration fee required</div>
          <div className="text-[24px] font-semibold">{displayBalance(arbitrationCost, 18)} ETH</div>
        </div>
      )}

      {!hasEnoughBalance && (
        <Alert type="warning" title="Insufficient balance">
          You don't have enough ETH to pay for the arbitration fee.
        </Alert>
      )}

      <div className="space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button
          variant="primary"
          type="button"
          onClick={onRaiseDispute}
          disabled={isUndefined(arbitrationCost) || !hasEnoughBalance || raiseDispute.isPending || !address || !chainId}
          isLoading={raiseDispute.isPending}
          text="Raise a Dispute"
        />
      </div>
    </div>
  );
}
