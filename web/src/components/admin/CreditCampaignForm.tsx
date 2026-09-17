import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { type CreditCampaignPayload, useCreateCreditCampaign } from "@/hooks/admin/useAdminCreditCampaigns";
import { useConvertToShares } from "@/hooks/trade/useShareAssetRatio";
import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { gnosis } from "viem/chains";

const MAX_CARDS = 5000;

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("en-US", { maximumFractionDigits });
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
  const createCampaign = useCreateCreditCampaign(onClose);

  const cardCount = Number(form.cardCount);
  const minUsd = Number(form.minUsd);
  const maxUsd = Number(form.maxUsd);

  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Name is required.");
  if (!Number.isInteger(cardCount) || cardCount < 1 || cardCount > MAX_CARDS) {
    errors.push(`Cards must be a whole number between 1 and ${MAX_CARDS}.`);
  }
  if (!Number.isInteger(minUsd) || !Number.isInteger(maxUsd) || minUsd < 1) {
    errors.push("Amounts must be whole USD, at least $1.");
  } else if (maxUsd < minUsd) {
    errors.push("Max must be greater than or equal to min.");
  }
  const isValid = errors.length === 0;

  const estimatedTotalUsd = isValid ? cardCount * ((minUsd + maxUsd) / 2) : 0;
  const { data: estimatedCreditsWei } = useConvertToShares(
    isValid ? parseEther(String(estimatedTotalUsd)) : 0n,
    gnosis.id,
  );

  const handleSubmit = () => {
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
          value={form.name}
          maxLength={80}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <p className="text-[12px] text-base-content/60 mt-2">
          Card serials are derived from the name, e.g. ETHCC2026-0001.
        </p>
      </div>

      <div>
        <label htmlFor="credit-campaign-count" className="text-sm font-semibold mb-1 block">
          Number of cards
        </label>
        <Input
          id="credit-campaign-count"
          className="w-full"
          type="number"
          min={1}
          max={MAX_CARDS}
          step={1}
          value={form.cardCount}
          onChange={(e) => setForm((prev) => ({ ...prev, cardCount: e.target.value }))}
        />
        <p className="text-[12px] text-base-content/60 mt-2">
          Fixed once created. Create another campaign to print more cards.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="credit-campaign-min" className="text-sm font-semibold mb-1 block">
            Min per card (USD)
          </label>
          <Input
            id="credit-campaign-min"
            className="w-full"
            type="number"
            min={1}
            step={1}
            value={form.minUsd}
            onChange={(e) => setForm((prev) => ({ ...prev, minUsd: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="credit-campaign-max" className="text-sm font-semibold mb-1 block">
            Max per card (USD)
          </label>
          <Input
            id="credit-campaign-max"
            className="w-full"
            type="number"
            min={1}
            step={1}
            value={form.maxUsd}
            onChange={(e) => setForm((prev) => ({ ...prev, maxUsd: e.target.value }))}
          />
        </div>
      </div>

      <div className="rounded-lg bg-base-200 p-4 text-sm space-y-1">
        {isValid ? (
          <>
            <p>
              Each card gets a random whole amount between ${formatNumber(minUsd)} and ${formatNumber(maxUsd)}.
            </p>
            <p>
              Estimated total: <strong>${formatNumber(estimatedTotalUsd)}</strong>
              {estimatedCreditsWei !== undefined && (
                <> (≈ {formatNumber(Number(formatEther(estimatedCreditsWei)))} credits at today's sDAI rate)</>
              )}
            </p>
          </>
        ) : (
          errors.map((error) => (
            <p key={error} className="text-error-primary">
              {error}
            </p>
          ))
        )}
      </div>

      <p className="text-[12px] text-base-content/60">
        The campaign is created inactive. Activate it when the cards are handed out.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button text="Cancel" type="button" variant="secondary" onClick={onClose} disabled={createCampaign.isPending} />
        <Button
          text="Create"
          type="button"
          disabled={!isValid}
          isLoading={createCampaign.isPending}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}
