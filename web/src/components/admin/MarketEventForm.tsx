import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import Textarea from "@/components/Form/Textarea";
import { type EventFormState, emptyEventForm } from "@/components/admin/marketEventFormState";
import { useCreateMarketEvent, useUpdateMarketEvent } from "@/hooks/admin/useAdminMarketEvents";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { pickerDateToUtc } from "@/lib/date";
import { CalendarHTMLInputIcon } from "@/lib/icons";
import { useMarkets } from "@seer-pm/react";
import type { Market } from "@seer-pm/sdk";
import clsx from "clsx";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function MarketSearchPicker({
  chainId,
  marketId,
  onSelect,
  inputId,
}: {
  chainId: number;
  marketId: string;
  onSelect: (market: Market) => void;
  inputId?: string;
}) {
  const [search, setSearch] = useState("");
  const { data: marketsResult } = useMarkets({
    marketName: search,
    chainsList: [chainId.toString()],
    limit: 8,
    disabled: search.length < 2,
  });
  const markets = marketsResult?.markets ?? [];

  return (
    <div className="space-y-2">
      <Input
        id={inputId}
        className="w-full"
        placeholder="Search markets by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {marketId && (
        <p className="text-sm text-base-content/60">
          Selected: <span className="font-mono break-all">{marketId}</span>
        </p>
      )}
      {search.length >= 2 && markets.length > 0 && (
        <ul className="border border-base-300 rounded-lg max-h-48 overflow-y-auto">
          {markets.map((market) => (
            <li key={`${market.chainId}-${market.id}`}>
              <button
                type="button"
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm hover:bg-base-200",
                  market.id.toLowerCase() === marketId.toLowerCase() && "bg-purple-100",
                )}
                onClick={() => onSelect(market)}
              >
                {market.marketName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MarketEventFormContent({
  initial,
  onClose,
  lockedMarket,
}: {
  initial: EventFormState | null;
  onClose: () => void;
  lockedMarket?: Market;
}) {
  const [form, setForm] = useState<EventFormState>(initial ?? emptyEventForm());

  useEffect(() => {
    setForm(initial ?? emptyEventForm());
  }, [initial]);

  const createEvent = useCreateMarketEvent(onClose);
  const updateEvent = useUpdateMarketEvent(onClose);
  const isEditing = !!form.id;
  const isPending = createEvent.isPending || updateEvent.isPending;

  const chainOptions = Object.values(SUPPORTED_CHAINS).map((chain) => ({
    value: chain.id,
    text: chain.name,
  }));

  const handleSubmit = () => {
    if (!form.marketId || !form.title || !form.eventAt) {
      return;
    }

    const payload = {
      marketId: form.marketId,
      chainId: form.chainId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      eventAt: pickerDateToUtc(form.eventAt).toISOString(),
    };

    if (isEditing && form.id) {
      updateEvent.mutate({
        id: form.id,
        title: payload.title,
        description: payload.description,
        eventAt: payload.eventAt,
      });
    } else {
      createEvent.mutate(payload);
    }
  };

  return (
    <div className="space-y-4">
      {!lockedMarket && !isEditing && (
        <>
          <div>
            <label htmlFor="event-chain-id" className="text-sm font-semibold mb-1 block">
              Chain
            </label>
            <select
              id="event-chain-id"
              className="select select-bordered w-full bg-base-100"
              value={form.chainId}
              onChange={(e) => setForm((prev) => ({ ...prev, chainId: Number(e.target.value), marketId: "" }))}
            >
              {chainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="event-market-search" className="text-sm font-semibold mb-1 block">
              Market
            </label>
            <MarketSearchPicker
              inputId="event-market-search"
              chainId={form.chainId}
              marketId={form.marketId}
              onSelect={(market) =>
                setForm((prev) => ({
                  ...prev,
                  marketId: market.id,
                  chainId: market.chainId,
                }))
              }
            />
          </div>
        </>
      )}

      {lockedMarket && !isEditing && (
        <div>
          <span className="text-sm font-semibold mb-1 block">Market</span>
          <p className="text-sm">{lockedMarket.marketName}</p>
          <p className="text-xs text-base-content/60 font-mono break-all mt-1">{lockedMarket.id}</p>
        </div>
      )}

      <div>
        <label htmlFor="event-title" className="text-sm font-semibold mb-1 block">
          Title
        </label>
        <Input
          id="event-title"
          className="w-full"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="event-description" className="text-sm font-semibold mb-1 block">
          Description
        </label>
        <Textarea
          id="event-description"
          className="w-full min-h-[100px]"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="event-date-at" className="text-sm font-semibold mb-1 block">
          Event date (UTC)
        </label>
        <div className="relative">
          <DatePicker
            id="event-date-at"
            selected={form.eventAt}
            onChange={(date) => setForm((prev) => ({ ...prev, eventAt: date }))}
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            timeFormat="HH:mm"
            placeholderText="yyyy-MM-dd HH:mm UTC"
            className="input input-bordered w-full bg-base-100 focus:outline-purple-primary"
            calendarClassName="custom-date-picker"
            showYearDropdown
            dropdownMode="select"
          />
          <div className="absolute right-[20px] top-0 bottom-0 flex items-center pointer-events-none">
            <CalendarHTMLInputIcon />
          </div>
        </div>
        <p className="text-[12px] text-base-content/60 mt-2">Enter the event time in UTC.</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button text="Cancel" type="button" variant="secondary" onClick={onClose} disabled={isPending} />
        <Button
          text={isEditing ? "Save" : "Create"}
          type="button"
          disabled={!form.marketId || !form.title || !form.eventAt || isPending}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}
