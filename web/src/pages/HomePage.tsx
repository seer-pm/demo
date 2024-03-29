import { Alert } from "@/components/Alert";
import { Dropdown } from "@/components/Dropdown";
import { LinkButton } from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import Select from "@/components/Form/Select";
import { MarketHeader, STATUS_TEXTS } from "@/components/Market/MarketHeader";
import { Spinner } from "@/components/Spinner";
import { Market_OrderBy } from "@/hooks/queries/generated";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useMarkets } from "@/hooks/useMarkets";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { PlusIcon, SearchIcon } from "@/lib/icons";
import { useState } from "react";
import { useAccount } from "wagmi";

const ORDER_OPTIONS = [
  { value: Market_OrderBy.OutcomesSupply, text: "Open Interest" },
  { value: Market_OrderBy.OpeningTs, text: "Opening Date" },
];

function MarketsFilter({
  setMarketName,
  setMarketStatus,
  orderBy,
  setOrderBy,
}: {
  setMarketName: (marketName: string) => void;
  setMarketStatus: (status: MarketStatus | "") => void;
  orderBy: Market_OrderBy;
  setOrderBy: (value: Market_OrderBy) => void;
}) {
  const status = [
    { value: "", text: "All status" },
    { value: MarketStatus.NOT_OPEN, text: STATUS_TEXTS[MarketStatus.NOT_OPEN] },
    { value: MarketStatus.OPEN, text: STATUS_TEXTS[MarketStatus.OPEN] },
    { value: MarketStatus.ANSWER_NOT_FINAL, text: STATUS_TEXTS[MarketStatus.ANSWER_NOT_FINAL] },
    { value: MarketStatus.IN_DISPUTE, text: STATUS_TEXTS[MarketStatus.IN_DISPUTE] },
    { value: MarketStatus.PENDING_EXECUTION, text: STATUS_TEXTS[MarketStatus.PENDING_EXECUTION] },
    { value: MarketStatus.CLOSED, text: STATUS_TEXTS[MarketStatus.CLOSED] },
  ];

  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setMarketName((event.target as HTMLInputElement).value);
  };

  const marketStatusCallback = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMarketStatus(Number((event.target as HTMLSelectElement).value) as MarketStatus | "");
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row max-lg:space-y-[12px] lg:space-x-[24px]">
        <div className="grow">
          <Input placeholder="Search" className="w-full" icon={<SearchIcon />} onKeyUp={marketNameCallback} />
        </div>
        <div>
          <Select options={status} onChange={marketStatusCallback} className="w-full" />
        </div>
        <div>
          <LinkButton to={"/create-market"} text="Create New Market" icon={<PlusIcon />} className="max-lg:w-full" />
        </div>
      </div>
      <div className="text-right">
        <Dropdown options={ORDER_OPTIONS} value={orderBy} onClick={setOrderBy} />
      </div>
    </div>
  );
}

function Home() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const [marketName, setMarketName] = useState("");
  const [marketStatus, setMarketStatus] = useState<MarketStatus | "">("");
  const [orderBy, serOrderBy] = useState<Market_OrderBy>(ORDER_OPTIONS[0].value);
  const { data: markets = [], isPending } = useMarkets(chainId as SupportedChain, marketName, marketStatus, orderBy);

  return (
    <div className="max-w-[1184px] mx-auto py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px] px-10">
      <div className="text-[24px] font-semibold">Markets</div>
      <MarketsFilter
        setMarketName={setMarketName}
        setMarketStatus={setMarketStatus}
        orderBy={orderBy}
        setOrderBy={serOrderBy}
      />

      {isPending && (
        <div className="py-10 px-10">
          <Spinner />
        </div>
      )}

      {!isPending && markets.length === 0 && <Alert type="warning">No markets found.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {markets.map((market) => (
          <MarketHeader market={market} chainId={chainId as SupportedChain} isPreview={true} key={market.id} />
        ))}
      </div>
    </div>
  );
}

export default Home;
