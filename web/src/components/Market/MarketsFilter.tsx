import { Market_OrderBy } from "@/hooks/queries/generated";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { PlusIcon, SearchIcon } from "@/lib/icons";
import { Dropdown } from "../Dropdown";
import { LinkButton } from "../Form/Button";
import Input from "../Form/Input";
import Select from "../Form/Select";
import { STATUS_TEXTS } from "./Header/MarketHeader";

export const ORDER_OPTIONS = [
  { value: Market_OrderBy.OutcomesSupply, text: "Open Interest" },
  { value: Market_OrderBy.OpeningTs, text: "Opening Date" },
];

export function MarketsFilter({
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
    { value: MarketStatus.NOT_OPEN, text: STATUS_TEXTS[MarketStatus.NOT_OPEN]() },
    { value: MarketStatus.OPEN, text: STATUS_TEXTS[MarketStatus.OPEN]() },
    { value: MarketStatus.ANSWER_NOT_FINAL, text: STATUS_TEXTS[MarketStatus.ANSWER_NOT_FINAL]() },
    { value: MarketStatus.IN_DISPUTE, text: STATUS_TEXTS[MarketStatus.IN_DISPUTE]() },
    { value: MarketStatus.PENDING_EXECUTION, text: STATUS_TEXTS[MarketStatus.PENDING_EXECUTION]() },
    { value: MarketStatus.CLOSED, text: STATUS_TEXTS[MarketStatus.CLOSED]() },
  ];

  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setMarketName((event.target as HTMLInputElement).value);
  };

  const marketStatusCallback = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMarketStatus((event.target as HTMLSelectElement).value as MarketStatus | "");
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
