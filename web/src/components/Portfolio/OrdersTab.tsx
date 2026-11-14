import Input from "@/components/Form/Input";
import UserOrdersPanel from "@/components/LimitOrders/UserOrdersPanel";
import { type OrdersPanelView, parseOrdersPanelView } from "@/components/LimitOrders/ordersShared";
import { useSearchParams } from "@/hooks/useSearchParams";
import { SearchIcon } from "@/lib/icons";
import type { SupportedChain } from "@seer-pm/sdk";
import { useState } from "react";
import type { Address } from "viem";

function OrdersTab({ account, chainId }: { account: Address | undefined; chainId: SupportedChain }) {
  const [filterText, setFilterText] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseOrdersPanelView(searchParams.get("view"));

  // The sub-view lives in the URL so a reload or a shared link lands on the same list.
  const setView = (nextView: OrdersPanelView) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextView === "active") {
          next.delete("view");
        } else {
          next.set("view", nextView);
        }
        return next;
      },
      { keepScrollPosition: true },
    );
  };

  return (
    <div>
      <div className="grow mb-6">
        <label className="sr-only" htmlFor="orders-search">
          Search by market or outcome
        </label>
        <Input
          id="orders-search"
          type="search"
          placeholder="Search by market or outcome"
          className="w-full"
          icon={<SearchIcon />}
          value={filterText}
          isClearable
          onClear={() => setFilterText("")}
          onChange={(event) => setFilterText(event.target.value)}
        />
      </div>
      <UserOrdersPanel
        account={account}
        chainId={chainId}
        filterText={filterText}
        onClearFilter={() => setFilterText("")}
        view={view}
        onViewChange={setView}
      />
    </div>
  );
}

export default OrdersTab;
