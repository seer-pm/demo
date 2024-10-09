import { Market } from "@/hooks/useMarket";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { SupportedChain } from "@/lib/chains";
import { useState } from "react";
import { Address } from "viem";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";

interface ConditionalTokenActionsProps {
  account?: Address;
  chainId: SupportedChain;
  router: Address;
  market: Market;
}

const titles = {
  mint: "Mint",
  merge: "Merge",
  redeem: "Redeem",
};

export function ConditionalTokenActions({ account, chainId, router, market }: ConditionalTokenActionsProps) {
  const [activeTab, setActiveTab] = useState<"mint" | "merge" | "redeem">("mint");

  const { data: marketStatus } = useMarketStatus(market, chainId);

  return (
    <div className="bg-white p-[24px] drop-shadow">
      <div className="text-[24px] font-semibold mb-[20px]">{titles[activeTab]}</div>
      <div role="tablist" className="tabs tabs-bordered font-semibold mb-[32px] overflow-x-auto custom-scrollbar pb-1">
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "mint" && "tab-active"}`}
          onClick={() => setActiveTab("mint")}
        >
          Mint
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "merge" && "tab-active"}`}
          onClick={() => setActiveTab("merge")}
        >
          Merge
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "redeem" && "tab-active"}`}
          onClick={() => setActiveTab("redeem")}
        >
          Redeem
        </button>
      </div>

      {activeTab === "mint" && <SplitForm account={account} chainId={chainId} router={router} market={market} />}

      {activeTab === "merge" && <MergeForm account={account} market={market} chainId={chainId} router={router} />}

      {activeTab === "redeem" &&
        (marketStatus === MarketStatus.CLOSED ? (
          <RedeemForm account={account} market={market} chainId={chainId} router={router} />
        ) : (
          "Redemptions are not available yet."
        ))}
    </div>
  );
}
