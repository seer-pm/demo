import { Alert } from "@/components/Alert";
import { isUndefined } from "@/lib/utils";

import { useGetAirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { Address } from "viem";
import AirdropTable from "./AirdropTable";

function AirdropTab({ account }: { account: Address | undefined }) {
  const { data: airdrop, error, isFetching, refetch } = useGetAirdropDataByUser(account);
  if (error) {
    return (
      <Alert type="error" title="Couldn't load your airdrop data">
        <div className="space-y-[12px]">
          <p>
            {error.code === "TIMEOUT"
              ? "This is taking longer than usual on our side. Your allocation is safe — please try again."
              : "Something went wrong loading your allocation."}
          </p>
          <button type="button" className="btn btn-sm btn-primary" disabled={isFetching} onClick={() => refetch()}>
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      </Alert>
    );
  }
  if (isUndefined(airdrop)) {
    return <div className="shimmer-container w-full h-[200px]" />;
  }
  return (
    <div>
      <AirdropTable data={[airdrop]} />
    </div>
  );
}

export default AirdropTab;
