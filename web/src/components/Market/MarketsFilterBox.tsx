import { Market_OrderBy } from "@/hooks/queries/gql-generated-seer";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import {
  ArrowSwap,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  Filter,
  LawBalanceIcon,
  QuestionIcon,
} from "@/lib/icons";
import { MarketStatus } from "@/lib/market";
import { VerificationStatus } from "@/lib/market";
import clsx from "clsx";
import { Fragment } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Button from "../Form/Button";
import FormError from "../Form/FormError";
import Input from "../Form/Input";
import Toggle from "../Form/Toggle";
import { STATUS_TEXTS } from "./Header";

const ORDER_OPTIONS = [
  { value: "default", text: "Default", tooltip: "Verification Status -> Liquidity" },
  { value: "liquidityUSD", text: "Liquidity" },
  { value: Market_OrderBy.OpeningTs, text: "Opening Date" },
  { value: "creationDate", text: "Creation Date" },
];

const VERIFY_STATUS_OPTIONS = [
  { value: "", text: "All" },
  { value: "verified", text: "Verified", icon: <CheckCircleIcon />, colorClassName: "text-success-primary" },
  { value: "verifying", text: "Verifying", icon: <ClockIcon />, colorClassName: "text-blue-primary" },
  { value: "challenged", text: "Challenged", icon: <LawBalanceIcon />, colorClassName: "text-warning-primary" },
  {
    value: "not_verified",
    text: "Not Verified",
    icon: <ExclamationCircleIcon width="14" height="14" />,
    colorClassName: "text-purple-primary",
  },
];

const CHAINS_OPTIONS = [
  { value: "", text: "All" },
  ...Object.values(SUPPORTED_CHAINS).map((chain) => ({ value: String(chain.id), text: chain.name })),
];

const MARKET_STATUS_OPTIONS = [
  { value: "", text: "All", icon: <div className="w-2 h-2 rounded-full	bg-black-primary flex-shrink-0" /> },
  {
    value: MarketStatus.NOT_OPEN,
    text: STATUS_TEXTS[MarketStatus.NOT_OPEN](),
    icon: <div className="w-2 h-2 rounded-full	bg-blue-primary flex-shrink-0" />,
  },
  {
    value: MarketStatus.OPEN,
    text: STATUS_TEXTS[MarketStatus.OPEN](),
    icon: <div className="w-2 h-2 rounded-full	bg-purple-primary flex-shrink-0" />,
  },
  {
    value: MarketStatus.ANSWER_NOT_FINAL,
    text: STATUS_TEXTS[MarketStatus.ANSWER_NOT_FINAL](),
    icon: <div className="w-2 h-2 rounded-full	bg-warning-primary flex-shrink-0" />,
  },
  {
    value: MarketStatus.IN_DISPUTE,
    text: STATUS_TEXTS[MarketStatus.IN_DISPUTE](),
    icon: <div className="w-2 h-2 rounded-full	bg-blue-secondary flex-shrink-0" />,
  },
  {
    value: MarketStatus.PENDING_EXECUTION,
    text: STATUS_TEXTS[MarketStatus.PENDING_EXECUTION](),
    icon: <div className="w-2 h-2 rounded-full	bg-tint-blue-primary flex-shrink-0" />,
  },
  {
    value: MarketStatus.CLOSED,
    text: STATUS_TEXTS[MarketStatus.CLOSED](),
    icon: <div className="w-2 h-2 rounded-full	bg-success-primary flex-shrink-0" />,
  },
];

interface MarketFilters {
  marketStatusList: MarketStatus[];
  verificationStatusList: VerificationStatus[];
  chainsList: string[];
  orderBy: Market_OrderBy | "default";
  showConditionalMarkets: boolean;
  showMarketsWithRewards: boolean;
  showFutarchyMarkets: boolean;
  orderDirection: "asc" | "desc";
  minLiquidity: number;
}

export function MarketsFilterBox({ setShowFilters }: { setShowFilters: (isShowFilters: boolean) => void }) {
  const {
    marketStatusList: initialMarketStatusList,
    verificationStatusList: initialVerificationStatusList,
    chainsList: initialChainsList,
    orderBy: initialOrderBy,
    showConditionalMarkets: initialShowConditionalMarkets,
    showMarketsWithRewards: initialShowMarketsWithRewards,
    showFutarchyMarkets: initialShowFutarchyMarkets,
    orderDirection: initialOrderDirection,
    minLiquidity: initialMinLiquidity,
    setMarketStatus,
    setVerificationStatus,
    setChains,
    setOrderBy,
    toggleShowConditionalMarkets,
    toggleShowMarketsWithRewards,
    toggleShowFutarchyMarkets,
    setOrderDirection,
    setMinLiquidity,
  } = useMarketsSearchParams();
  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<MarketFilters>({
    mode: "all",
    defaultValues: {
      marketStatusList: initialMarketStatusList ?? MARKET_STATUS_OPTIONS.slice(1).map((x) => x.value as MarketStatus),
      verificationStatusList:
        initialVerificationStatusList ?? VERIFY_STATUS_OPTIONS.slice(1).map((x) => x.value as VerificationStatus),
      chainsList: initialChainsList ?? CHAINS_OPTIONS.slice(1).map((x) => x.value),
      orderBy: initialOrderBy ?? "default",
      showConditionalMarkets: initialShowConditionalMarkets ?? false,
      showMarketsWithRewards: initialShowMarketsWithRewards ?? false,
      showFutarchyMarkets: initialShowFutarchyMarkets ?? false,
      orderDirection: initialOrderDirection ?? "desc",
      minLiquidity: initialMinLiquidity ?? 0,
    },
  });

  const apply: SubmitHandler<MarketFilters> = (data) => {
    const {
      marketStatusList,
      verificationStatusList,
      chainsList,
      orderBy,
      showConditionalMarkets,
      showMarketsWithRewards,
      showFutarchyMarkets,
      orderDirection,
      minLiquidity,
    } = data;
    setMarketStatus(marketStatusList.length === MARKET_STATUS_OPTIONS.slice(1).length ? undefined : marketStatusList);
    setVerificationStatus(
      verificationStatusList.length === VERIFY_STATUS_OPTIONS.slice(1).length ? undefined : verificationStatusList,
    );
    setChains(chainsList.length === CHAINS_OPTIONS.slice(1).length ? undefined : chainsList);
    setOrderBy(orderBy);
    setShowFilters(false);
    toggleShowConditionalMarkets(showConditionalMarkets);
    toggleShowMarketsWithRewards(showMarketsWithRewards);
    toggleShowFutarchyMarkets(showFutarchyMarkets);
    if (orderBy !== "default") {
      setOrderDirection(orderDirection);
    }
    setMinLiquidity(minLiquidity);
  };
  const isDefaultOrder = watch("orderBy") === "default" || !watch("orderBy");
  return (
    <div className="bg-white border border-black-medium rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] w-full py-5 @container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 [&>*]:border-black-medium [&>*]:border-r-0 sm:[&>*]:border-r sm:[&>*:nth-child(2n)]:border-r-0 lg:[&>*]:border-r lg:[&>*:nth-child(2n)]:border-r lg:[&>*:nth-child(3n)]:border-r-0">
        <div className="px-10">
          <div className="font-semibold flex items-center gap-2 pb-3">
            Market States{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </div>
          <Controller
            name="marketStatusList"
            control={control}
            rules={{
              validate: {
                arrayNotEmpty: (v) => v.length > 0 || "Select at least one.",
              },
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="flex flex-col gap-2">
                  {MARKET_STATUS_OPTIONS.map((option) => (
                    <Fragment key={option.value}>
                      <div className="flex items-center mx-1 gap-6">
                        <input
                          id={`market-status-${option.value}`}
                          className="cursor-pointer checkbox"
                          type="checkbox"
                          checked={
                            option.value === ""
                              ? field.value.length === MARKET_STATUS_OPTIONS.slice(1).length
                              : field.value.includes(option.value as MarketStatus)
                          }
                          onChange={(e) => {
                            const value = option.value;
                            const checked = e.target.checked;
                            if (value === "") {
                              return field.onChange(
                                checked ? MARKET_STATUS_OPTIONS.slice(1).map((x) => x.value as MarketStatus) : [],
                              );
                            }
                            field.onChange(
                              checked ? [...field.value, value] : field.value.filter((item) => item !== value),
                            );
                          }}
                        />
                        <label
                          className="cursor-pointer flex items-center gap-2"
                          htmlFor={`market-status-${option.value}`}
                        >
                          {option?.icon}
                          {option.text}
                        </label>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="absolute">
                  <FormError errors={errors} name="marketStatusList" />
                </div>
              </div>
            )}
          />
        </div>
        <div className="px-10">
          <div className="font-semibold flex items-center gap-2 pb-3">
            Verification Status{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </div>
          <Controller
            name="verificationStatusList"
            control={control}
            rules={{
              validate: {
                arrayNotEmpty: (v) => v.length > 0 || "Select at least one.",
              },
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="flex flex-col gap-2">
                  {VERIFY_STATUS_OPTIONS.map((option) => (
                    <Fragment key={option.value}>
                      <div className="flex items-center mx-1 gap-6">
                        <input
                          id={`verification-status-${option.value}`}
                          className="cursor-pointer checkbox"
                          type="checkbox"
                          checked={
                            option.value === ""
                              ? field.value.length === VERIFY_STATUS_OPTIONS.slice(1).length
                              : field.value.includes(option.value as VerificationStatus)
                          }
                          onChange={(e) => {
                            const value = option.value;
                            const checked = e.target.checked;
                            if (value === "") {
                              return field.onChange(
                                checked ? VERIFY_STATUS_OPTIONS.slice(1).map((x) => x.value as VerificationStatus) : [],
                              );
                            }
                            field.onChange(
                              checked ? [...field.value, value] : field.value.filter((item) => item !== value),
                            );
                          }}
                        />
                        <label
                          className={clsx("cursor-pointer flex items-center gap-2", option.colorClassName)}
                          htmlFor={`verification-status-${option.value}`}
                        >
                          {option.icon}
                          {option.text}
                        </label>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="absolute">
                  <FormError errors={errors} name="verificationStatusList" />
                </div>
              </div>
            )}
          />
        </div>
        <div className="px-10">
          <div className="font-semibold flex items-center gap-2 pb-3">
            Chain{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </div>
          <Controller
            name="chainsList"
            control={control}
            rules={{
              validate: {
                arrayNotEmpty: (v) => v.length > 0 || "Select at least one.",
              },
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="flex flex-col gap-2">
                  {CHAINS_OPTIONS.map((option) => (
                    <Fragment key={option.value}>
                      <div className="flex items-center mx-1 gap-6">
                        <input
                          id={`chains-${option.value}`}
                          className="cursor-pointer checkbox"
                          type="checkbox"
                          checked={
                            option.value === ""
                              ? field.value.length === CHAINS_OPTIONS.slice(1).length
                              : field.value.includes(option.value)
                          }
                          onChange={(e) => {
                            const value = option.value;
                            const checked = e.target.checked;
                            if (value === "") {
                              return field.onChange(checked ? CHAINS_OPTIONS.slice(1).map((x) => x.value) : []);
                            }
                            field.onChange(
                              checked ? [...field.value, value] : field.value.filter((item) => item !== value),
                            );
                          }}
                        />
                        <label className="cursor-pointer flex items-center gap-2" htmlFor={`chains-${option.value}`}>
                          {NETWORK_ICON_MAPPING[Number(option.value)] && (
                            <img
                              alt="network-icon"
                              className="w-5 h-5 rounded-full"
                              src={NETWORK_ICON_MAPPING[Number(option.value)]}
                            />
                          )}
                          {option.text}
                        </label>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="absolute">
                  <FormError errors={errors} name="chainsList" />
                </div>
              </div>
            )}
          />
        </div>
        <div className="px-10">
          <div className="font-semibold flex items-center gap-2 pb-3">
            Sort By <ArrowSwap />
            <div className="flex gap-2 ml-auto">
              <div
                className={clsx(
                  "font-normal",
                  watch("orderDirection") === "desc" && "text-purple-primary",
                  isDefaultOrder && "!text-black-secondary",
                )}
              >
                Desc
              </div>
              <Toggle
                className="bg-purple-primary hover:bg-purple-primary disabled:bg-black-primary"
                checked={watch("orderDirection") === "asc"}
                onChange={(e) => setValue("orderDirection", e.target.checked ? "asc" : "desc")}
                disabled={isDefaultOrder}
              />
              <div
                className={clsx(
                  "font-normal",
                  watch("orderDirection") === "asc" && "text-purple-primary",
                  isDefaultOrder && "!text-black-secondary",
                )}
              >
                Asc
              </div>
            </div>
          </div>
          <Controller
            name="orderBy"
            control={control}
            rules={{
              required: true,
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="flex flex-col gap-2">
                  {ORDER_OPTIONS.map((option) => (
                    <Fragment key={option.value}>
                      <div className="flex items-center mx-1 gap-6">
                        <input
                          id={`order-by-${option.value}`}
                          className="cursor-pointer radio"
                          name="orderBy"
                          type="radio"
                          checked={option.value === field.value}
                          onChange={() => {
                            field.onChange(option.value);
                          }}
                        />
                        <label className="cursor-pointer flex items-center gap-2" htmlFor={`order-by-${option.value}`}>
                          {option.text}
                        </label>
                        {option.tooltip && (
                          <div className="tooltip">
                            <p className="tooltiptext">{option.tooltip}</p>
                            <QuestionIcon fill="#9747FF" />
                          </div>
                        )}
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
        <div className="px-10">
          <div className="font-semibold flex items-center gap-2 pb-3">
            Conditional Market{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </div>
          <div className="flex items-center mx-1 gap-6">
            <input
              className="cursor-pointer checkbox"
              id="show-conditional-market"
              type="checkbox"
              checked={watch("showConditionalMarkets")}
              onChange={(e) => setValue("showConditionalMarkets", e.target.checked)}
            />
            <label className="cursor-pointer flex items-center gap-2" htmlFor="show-conditional-market">
              Show only conditional markets
            </label>
          </div>
          <div className="font-semibold flex items-center gap-2 pb-3 mt-5">
            Rewards{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </div>
          <div className="flex items-center mx-1 gap-6">
            <input
              className="cursor-pointer checkbox"
              id="show-reward-market"
              type="checkbox"
              checked={watch("showMarketsWithRewards")}
              onChange={(e) => setValue("showMarketsWithRewards", e.target.checked)}
            />
            <label className="cursor-pointer flex items-center gap-2" htmlFor="show-reward-market">
              Show only markets with rewards
            </label>
          </div>
        </div>
        <div className="px-10">
          <div className="font-semibold flex items-center gap-2 pb-3">
            Minimum Liquidity{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </div>
          <div className="flex items-center mx-1 gap-6">
            <Input
              autoComplete="off"
              type="number"
              step="any"
              min="0"
              className="w-full"
              value={watch("minLiquidity")}
              onChange={(e) => setValue("minLiquidity", Number(e.target.value ?? 0))}
            />
          </div>
          <div className="font-semibold flex items-center gap-2 pb-3 mt-5">
            Futarchy{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </div>
          <div className="flex items-center mx-1 gap-6">
            <input
              className="cursor-pointer checkbox"
              id="show-futarchy-markets"
              type="checkbox"
              checked={watch("showFutarchyMarkets")}
              onChange={(e) => setValue("showFutarchyMarkets", e.target.checked)}
            />
            <label className="cursor-pointer flex items-center gap-2" htmlFor="show-futarchy-markets">
              Show only futarchy markets
            </label>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end px-9 gap-8 mt-4">
        <button
          type="button"
          className="text-purple-primary hover:opacity-50 text-[14px]"
          onClick={() => setShowFilters(false)}
        >
          Cancel
        </button>
        <Button text="Apply" onClick={handleSubmit(apply)} disabled={Object.keys(errors).length > 0} size="small" />
      </div>
    </div>
  );
}
