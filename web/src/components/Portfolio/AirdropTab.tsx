import { Alert } from "@/components/Alert";
import { isUndefined } from "@/lib/utils";

import { useGetAirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { formatSeer } from "@/lib/airdropFormat";
import { Address } from "viem";
import AirdropTable from "./AirdropTable";

export function AirdropHero({ account }: { account: Address }) {
  const { data, isPending, isError } = useGetAirdropDataByUser(account);
  if (isError) return null;
  if (isPending || isUndefined(data)) {
    return (
      <div className="sm:text-right min-w-0 w-full sm:w-auto">
        <div className="shimmer-container h-10 w-[240px] max-w-full sm:ml-auto" aria-hidden />
      </div>
    );
  }
  return (
    <p className="text-[32px] leading-tight font-semibold text-purple-primary dark:text-purple-secondary tabular-nums sm:text-right min-w-0">
      {formatSeer(data.totalAllocation)} <span className="text-lg font-medium">SEER</span>
    </p>
  );
}

function AirdropTab({ account }: { account: Address | undefined }) {
  const { data: airdrop, error, isFetching, refetch } = useGetAirdropDataByUser(account);
  if (error) {
    return (
      <Alert type="error" title="Couldn't load your airdrop data">
        <div className="space-y-[12px]">
          <p>
            {error.code === "TIMEOUT"
              ? "This is taking longer than usual. Your allocation is safe — try again."
              : "Couldn't load this profile's SEER estimates."}
          </p>
          <button
            type="button"
            className="btn btn-sm btn-primary min-h-11"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      </Alert>
    );
  }
  if (isUndefined(airdrop)) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading airdrop estimates</span>
        <div className="space-y-8" aria-hidden>
          <div className="shimmer-container h-4 w-full max-w-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="shimmer-container h-20" />
            <div className="shimmer-container h-20" />
            <div className="shimmer-container h-20" />
            <div className="shimmer-container h-20" />
          </div>
        </div>
      </div>
    );
  }
  return <AirdropTable data={airdrop} account={account} />;
}

export default AirdropTab;
