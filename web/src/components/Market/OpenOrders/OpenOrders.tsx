import UserOrdersPanel from "@/components/LimitOrders/UserOrdersPanel";
import type { Market } from "@seer-pm/sdk";
import { useAccount } from "wagmi";

export default function OpenOrders({ market }: { market: Market }) {
  const { address } = useAccount();

  return (
    <div className="p-4 card shadow-sm border-separator-100">
      <h3 className="text-[16px] font-semibold mb-4">Your orders</h3>
      <UserOrdersPanel account={address} chainId={market.chainId} market={market} />
    </div>
  );
}
