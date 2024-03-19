import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import Select from "@/components/Form/Select";
import { MarketHeader, STATUS_TEXTS } from "@/components/Market/MarketHeader";
import { Spinner } from "@/components/Spinner";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useMarkets } from "@/hooks/useMarkets";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { CategoryIcon, SearchIcon } from "@/lib/icons";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

function MarketsFilter({
  setMarketName,
  setMarketStatus,
}: { setMarketName: (marketName: string) => void; setMarketStatus: (status: MarketStatus | "") => void }) {
  const status = [
    { value: "", text: "All status" },
    { value: MarketStatus.NOT_OPEN, text: STATUS_TEXTS[MarketStatus.NOT_OPEN] },
    { value: MarketStatus.OPEN, text: STATUS_TEXTS[MarketStatus.OPEN] },
    { value: MarketStatus.ANSWER_NOT_FINAL, text: STATUS_TEXTS[MarketStatus.ANSWER_NOT_FINAL] },
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
    <div className="flex space-x-[24px]">
      <div className="grow">
        <Input placeholder="Search" className="w-full" icon={<SearchIcon />} onKeyUp={marketNameCallback} />
      </div>
      <div>
        <Select options={status} onChange={marketStatusCallback} />
      </div>
      <div>
        <Link to={"/create-market"}>
          <Button text="Create New Market" icon={<CategoryIcon />} />
        </Link>
      </div>
    </div>
  );
}

function Home() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const [marketName, setMarketName] = useState("");
  const [marketStatus, setMarketStatus] = useState<MarketStatus | "">("");
  const { data: markets = [], isPending } = useMarkets(chainId as SupportedChain, marketName, marketStatus);

  return (
    <div className="max-w-[1184px] mx-auto py-[65px] space-y-[48px]">
      <div className="text-[24px] font-semibold">Markets</div>
      <MarketsFilter setMarketName={setMarketName} setMarketStatus={setMarketStatus} />

      {isPending && (
        <div className="py-10 px-10">
          <Spinner />
        </div>
      )}

      {!isPending && markets.length === 0 && <Alert type="warning">No markets found.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {markets.map((market) => (
          <MarketHeader
            market={market}
            chainId={chainId as SupportedChain}
            showOutcomes={true}
            outcomesCount={3}
            key={market.id}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
