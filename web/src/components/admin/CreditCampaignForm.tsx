import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { type CreditCampaignPayload, useCreateCreditCampaign } from "@/hooks/admin/useAdminCreditCampaigns";
import { useConvertToShares } from "@/hooks/trade/useShareAssetRatio";
import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { gnosis } from "viem/chains";

const MAX_CARDS = 5000;
// Mirrors MAX_CARD_USD in admin-credit-campaigns.
const MAX_CARD_USD = 10_000;

type Field = "name" | "cardCount" | "minUsd" | "maxUsd";

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("en-US", { maximumFractionDigits });
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[12px] text-error-primary mt-1">
      {message}
    </p>
  );
}

export function CreditCampaignFormContent({
  initial,
  onClose,
}: {
  initial: CreditCampaignPayload;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial.name,
    cardCount: String(initial.cardCount),
    minUsd: String(initial.minUsd),
    maxUsd: String(initial.maxUsd),
  });
  // Errors show once a field was left or a submit was attempted, not while the form is still blank.
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const createCampaign = useCreateCreditCampaign(onClose);

  const cardCount = Number(form.cardCount);
  const minUsd = Number(form.minUsd);
  const maxUsd = Number(form.maxUsd);

  const errors: Partial<Record<Field, string>> = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!Number.isInteger(cardCount) || cardCount < 1 || cardCount > MAX_CARDS) {
    errors.cardCount = `A whole number between 1 and ${formatNumber(MAX_CARDS)}.`;
  }
  if (!Number.isInteger(minUsd) || minUsd < 1 || minUsd > MAX_CARD_USD) {
    errors.minUsd = `Whole USD between $1 and $${formatNumber(MAX_CARD_USD)}.`;
  }
  if (!Number.isInteger(maxUsd) || maxUsd < 1 || maxUsd > MAX_CARD_USD) {
    errors.maxUsd = `Whole USD between $1 and $${formatNumber(MAX_CARD_USD)}.`;
  } else if (!errors.minUsd && maxUsd < minUsd) {
    errors.maxUsd = "Must be at least the min.";
  }
  const isValid = Object.keys(errors).length === 0;
  const visibleError = (field: Field) => (submitted || touched[field] ? errors[field] : undefined);

  const estimatedTotalUsd = isValid ? cardCount * ((minUsd + maxUsd) / 2) : 0;
  const { data: estimatedCreditsWei } = useConvertToShares(
    isValid ? parseEther(String(estimatedTotalUsd)) : 0n,
    gnosis.id,
  );

  const fieldProps = (field: Field) => ({
    value: form[field],
    "aria-invalid": !!visibleError(field),
    "aria-describedby": visibleError(field) ? `credit-campaign-${field}-error` : undefined,
    onBlur: () => setTouched((prev) => ({ ...prev, [field]: true })),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value })),
  });

  const handleSubmit = () => {
    setSubmitted(true);
    if (!isValid) return;
    createCampaign.mutate({ name: form.name.trim(), cardCount, minUsd, maxUsd });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="credit-campaign-name" className="text-sm font-semibold mb-1 block">
          Name
        </label>
        <Input
          id="credit-campaign-name"
          className="w-full"
          placeholder="ETHCC 2026"
          maxLength={80}
          {...fieldProps("name")}
        />
        <FieldError id="credit-campaign-name-error" message={visibleError("name")} />
        <p className="text-[12px] text-base-content/70 mt-2">
          Shown on the claim page. Card serials are derived from it, e.g. ETHCC2026-0001.
        </p>
      </div>

      <div>
        <label htmlFor="credit-campaign-cardCount" className="text-sm font-semibold mb-1 block">
          Number of cards
        </label>
        <Input
          id="credit-campaign-cardCount"
          className="w-full"
          type="number"
          min={1}
          max={MAX_CARDS}
          step={1}
          {...fieldProps("cardCount")}
        />
        <FieldError id="credit-campaign-cardCount-error" message={visibleError("cardCount")} />
        <p className="text-[12px] text-base-content/70 mt-2">
          Fixed once created. Create another campaign to print more cards.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="credit-campaign-minUsd" className="text-sm font-semibold mb-1 block">
            Min per card (USD)
          </label>
          <Input
            id="credit-campaign-minUsd"
            className="w-full"
            type="number"
            min={1}
            max={MAX_CARD_USD}
            step={1}
            {...fieldProps("minUsd")}
          />
          <FieldError id="credit-campaign-minUsd-error" message={visibleError("minUsd")} />
        </div>
        <div>
          <label htmlFor="credit-campaign-maxUsd" className="text-sm font-semibold mb-1 block">
            Max per card (USD)
          </label>
          <Input
            id="credit-campaign-maxUsd"
            className="w-full"
            type="number"
            min={1}
            max={MAX_CARD_USD}
            step={1}
            {...fieldProps("maxUsd")}
          />
          <FieldError id="credit-campaign-maxUsd-error" message={visibleError("maxUsd")} />
        </div>
      </div>

      <div className="rounded-lg bg-base-200 p-4 text-sm space-y-1" aria-live="polite">
        {isValid ? (
          <>
            <p>
              Each card gets a random whole amount between ${formatNumber(minUsd)} and ${formatNumber(maxUsd)}. The
              claim page shows this range.
            </p>
            <p>
              Estimated total: <strong>${formatNumber(estimatedTotalUsd)}</strong>
              {estimatedCreditsWei !== undefined && (
                <> (≈ {formatNumber(Number(formatEther(estimatedCreditsWei)))} credits at today's sDAI rate)</>
              )}
            </p>
          </>
        ) : (
          <p className="text-base-content/70">Fill in every field to see the estimated cost.</p>
        )}
      </div>

      <p className="text-[12px] text-base-content/70">
        The campaign is created inactive. Activate it when the cards are handed out.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button text="Cancel" type="button" variant="secondary" onClick={onClose} disabled={createCampaign.isPending} />
        <Button text="Create" type="button" isLoading={createCampaign.isPending} onClick={handleSubmit} />
      </div>
    </div>
  );
}
