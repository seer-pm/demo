import { Alert } from "@/components/Alert";
import { isUndefined } from "@/lib/utils";

import { useGetAirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { useAccount } from "wagmi";
import AirdropTable from "./AirdropTable";

function AirdropTab() {
  const { address, chainId } = useAccount();
  const { data: airdrop, error } = useGetAirdropDataByUser(address, chainId);

  if (error) {
    return <Alert type="error">{error.message}</Alert>;
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
