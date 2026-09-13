import Input from "@/components/Form/Input";
import UserOrdersPanel from "@/components/LimitOrders/UserOrdersPanel";
import { SearchIcon } from "@/lib/icons";
import type { SupportedChain } from "@seer-pm/sdk";
import { useState } from "react";
import type { Address } from "viem";

function OrdersTab({ account, chainId }: { account: Address | undefined; chainId: SupportedChain }) {
  const [filterText, setFilterText] = useState("");

  return (
    <div>
      <div className="grow mb-6">
        <Input
          placeholder="Search by market or outcome"
          className="w-full"
          icon={<SearchIcon />}
          onKeyUp={(event) => setFilterText((event.target as HTMLInputElement).value)}
        />
      </div>
      <UserOrdersPanel account={account} chainId={chainId} filterText={filterText} />
    </div>
  );
}

export default OrdersTab;
