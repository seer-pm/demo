import { Market_OrderBy } from "@/hooks/queries/generated";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { VerificationStatus } from "@/hooks/useVerificationStatus";
import { PlusIcon, SearchIcon } from "@/lib/icons";
import { Dropdown } from "../Dropdown";
import { LinkButton } from "../Form/Button";
import Input from "../Form/Input";
import { STATUS_TEXTS } from "./Header/MarketHeader";

export const ORDER_OPTIONS = [
  { value: Market_OrderBy.OutcomesSupply, text: "Open Interest" },
  { value: Market_OrderBy.OpeningTs, text: "Opening Date" },
];

export const VERIFY_STATUS_OPTIONS: { value: VerificationStatus; text: string }[] = [
  { value: "verified", text: "Verified" },
  { value: "verifying", text: "Verifying" },
  { value: "not_verified", text: "Not Verified" },
];

const MARKET_STATUS_OPTIONS = [
  { value: "", text: "All status", icon: <div className="w-2 h-2 rounded-full	bg-black-primary" /> },
  {
    value: MarketStatus.NOT_OPEN,
    text: STATUS_TEXTS[MarketStatus.NOT_OPEN](),
    icon: <div className="w-2 h-2 rounded-full	bg-blue-primary" />,
  },
  {
    value: MarketStatus.OPEN,
    text: STATUS_TEXTS[MarketStatus.OPEN](),
    icon: <div className="w-2 h-2 rounded-full	bg-purple-primary" />,
  },
  {
    value: MarketStatus.ANSWER_NOT_FINAL,
    text: STATUS_TEXTS[MarketStatus.ANSWER_NOT_FINAL](),
    icon: <div className="w-2 h-2 rounded-full	bg-warning-primary" />,
  },
  {
    value: MarketStatus.IN_DISPUTE,
    text: STATUS_TEXTS[MarketStatus.IN_DISPUTE](),
    icon: <div className="w-2 h-2 rounded-full	bg-blue-secondary" />,
  },
  {
    value: MarketStatus.PENDING_EXECUTION,
    text: STATUS_TEXTS[MarketStatus.PENDING_EXECUTION](),
    icon: <div className="w-2 h-2 rounded-full	bg-tint-blue-primary" />,
  },
  {
    value: MarketStatus.CLOSED,
    text: STATUS_TEXTS[MarketStatus.CLOSED](),
    icon: <div className="w-2 h-2 rounded-full	bg-success-primary" />,
  },
];

export function MarketsFilter({
  marketStatus,
  orderBy,
  verificationStatus,
  setMarketName,
  setMarketStatus,
  setOrderBy,
  setVerificationStatus,
}: {
  marketStatus: MarketStatus | "";
  orderBy: Market_OrderBy | undefined;
  verificationStatus: VerificationStatus | undefined;
  setMarketName: (marketName: string) => void;
  setMarketStatus: (status: MarketStatus | "") => void;
  setOrderBy: (value: Market_OrderBy) => void;
  setVerificationStatus: (value: VerificationStatus) => void;
}) {
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setMarketName((event.target as HTMLInputElement).value);
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row max-lg:space-y-[12px] lg:space-x-[24px]">
        <div className="grow">
          <Input placeholder="Search" className="w-full" icon={<SearchIcon />} onKeyUp={marketNameCallback} />
        </div>
        <div>
          <Dropdown
            value={marketStatus ?? ""}
            options={MARKET_STATUS_OPTIONS}
            onClick={setMarketStatus}
            defaultLabel="Market Status"
            btnClassName="select select-bordered bg-white focus:outline-purple-primary w-[210px]"
          />
        </div>
        <div>
          <LinkButton to={"/create-market"} text="Create New Market" icon={<PlusIcon />} className="max-lg:w-full" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-4">
        <Dropdown
          options={VERIFY_STATUS_OPTIONS}
          value={verificationStatus}
          onClick={setVerificationStatus}
          defaultLabel="Verification Status"
        />
        <Dropdown options={ORDER_OPTIONS} value={orderBy} onClick={setOrderBy} defaultLabel="Order By" />
      </div>
    </div>
  );
}
