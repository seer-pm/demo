import { Market_OrderBy } from "@/hooks/queries/gql-generated-seer";
import { MarketStatus } from "@/hooks/useMarketStatus";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { VerificationStatus } from "@/hooks/useVerificationStatus";
import { ArrowSwap, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, Filter, QuestionIcon } from "@/lib/icons";
import clsx from "clsx";
import { Fragment } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Button from "../Form/Button";
import FormError from "../Form/FormError";
import { STATUS_TEXTS } from "./Header/MarketHeader";
export const ORDER_OPTIONS = [
  { value: "default", text: "Default", tooltip: "Your Markets -> Verification Status -> Liquidity" },
  { value: Market_OrderBy.OutcomesSupply, text: "Open Interest" },
  { value: Market_OrderBy.OpeningTs, text: "Opening Date" },
];

export const VERIFY_STATUS_OPTIONS = [
  { value: "", text: "All" },
  { value: "verified", text: "Verified", icon: <CheckCircleIcon />, colorClassName: "text-success-primary" },
  { value: "verifying", text: "Verifying", icon: <ClockIcon />, colorClassName: "text-blue-primary" },
  {
    value: "not_verified",
    text: "Not Verified",
    icon: <ExclamationCircleIcon width="14" height="14" />,
    colorClassName: "text-purple-primary",
  },
];

export const MARKET_STATUS_OPTIONS = [
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
  orderBy: Market_OrderBy | "default";
}

export function MarketsFilterBox({ setShowFilters }: { setShowFilters: (isShowFilters: boolean) => void }) {
  const {
    marketStatusList: initialMarketStatusList,
    orderBy: initialOrderBy,
    verificationStatusList: initialVerificationStatusList,
    setMarketStatus,
    setOrderBy,
    setVerificationStatus,
  } = useMarketsSearchParams();
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<MarketFilters>({
    mode: "all",
    defaultValues: {
      marketStatusList: initialMarketStatusList ?? MARKET_STATUS_OPTIONS.slice(1).map((x) => x.value as MarketStatus),
      verificationStatusList:
        initialVerificationStatusList ?? VERIFY_STATUS_OPTIONS.slice(1).map((x) => x.value as VerificationStatus),
      orderBy: initialOrderBy ?? "default",
    },
  });

  const apply: SubmitHandler<MarketFilters> = (data) => {
    const { marketStatusList, verificationStatusList, orderBy } = data;
    setMarketStatus(marketStatusList.length === MARKET_STATUS_OPTIONS.slice(1).length ? undefined : marketStatusList);
    setVerificationStatus(
      verificationStatusList.length === VERIFY_STATUS_OPTIONS.slice(1).length ? undefined : verificationStatusList,
    );
    setOrderBy(orderBy);
    setShowFilters(false);
  };

  return (
    <div className="bg-white border border-black-medium rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] w-full pt-12 pb-9 @container">
      <div className="flex justify-start mb-9 flex-wrap flex-col @[620px]:flex-row ">
        <div className=" border-black-medium px-10 mb-12 @[1200px]:px-20 @[920px]:mb-0 @[920px]:w-1/3 @[620px]:w-1/2 flex-shrink-0 @[620px]:border-r">
          <p className="font-semibold flex items-center gap-2 pb-12">
            Market States{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </p>
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
                <div className="flex flex-col gap-6">
                  {MARKET_STATUS_OPTIONS.map((option) => (
                    <Fragment key={option.value}>
                      <div className="flex items-center m-1 gap-6">
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
        <div className="flex-shrink-0 border-black-medium px-10 mb-12 @[1200px]:px-20 @[920px]:mb-0 @[920px]:w-1/3 @[620px]:w-1/2 @[920px]:border-r">
          <p className="font-semibold flex items-center gap-2 pb-12">
            Verification Status{" "}
            <div className="flex-shrink-0">
              <Filter />
            </div>
          </p>
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
                <div className="flex flex-col gap-6">
                  {VERIFY_STATUS_OPTIONS.map((option) => (
                    <Fragment key={option.value}>
                      <div className="flex items-center m-1 gap-6">
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
        <div className="flex-shrink-0 border-black-medium px-10 @[1200px]:px-20 @[920px]:w-1/3 @[920px]:border-r">
          <p className="font-semibold flex items-center gap-2 pb-12">
            Sort By <ArrowSwap />
          </p>
          <Controller
            name="orderBy"
            control={control}
            rules={{
              required: true,
            }}
            render={({ field }) => (
              <div className="relative">
                <div className="flex flex-col gap-6">
                  {ORDER_OPTIONS.map((option) => (
                    <Fragment key={option.value}>
                      <div className="flex items-center m-1 gap-6">
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
      </div>
      <div className="flex items-center justify-end px-9 gap-8">
        <button type="button" className="text-purple-primary hover:opacity-50" onClick={() => setShowFilters(false)}>
          Cancel
        </button>
        <Button text="Apply" onClick={handleSubmit(apply)} disabled={Object.keys(errors).length > 0} />
      </div>
    </div>
  );
}
