import { AirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { formatPct, formatSeer, hasAmount, seerValue } from "@/lib/airdropFormat";
import { isTwoStringsEqual } from "@/lib/utils";
import type { ReactNode } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { PohLinkCard } from "./PohLinkCard";

function Figure({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "poh";
}) {
  const poh = tone === "poh";
  return (
    <div className="min-w-0">
      <dt className="text-sm font-medium text-black-primary">{label}</dt>
      <dd
        className={`mt-1 text-lg font-semibold tabular-nums ${poh ? "text-purple-primary dark:text-purple-secondary" : "text-base-content"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function MetricGroup({
  title,
  description,
  children,
  accent = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={
        accent
          ? "bg-purple-medium dark:bg-neutral rounded-[3px] px-4 py-5 sm:px-5 border border-purple-primary/20 dark:border-purple-primary/40"
          : undefined
      }
    >
      <h3 className={`text-sm font-semibold ${accent ? "text-purple-primary" : "text-base-content"}`}>{title}</h3>
      <p className="text-sm text-black-primary mt-1 mb-4 max-w-prose">{description}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">{children}</dl>
    </section>
  );
}

/** Why the PoH figures move: they are recomputed nightly against today's profiles and links. */
const POH_ESTIMATE_NOTE =
  "Proof of Humanity amounts are an estimate. They assume today's verified profiles and links, and are recalculated every night for every past day. The final amount is set on the Proof of Humanity snapshot day, and can change until then as people link their profiles or let their verification expire.";

export default function AirdropTable({ data, account }: { data: AirdropDataByUser; account?: Address }) {
  const { address: connectedAccount } = useAccount();

  const isOwnProfile = isTwoStringsEqual(connectedAccount, account);
  const isEmpty = [
    data.totalAllocation,
    data.monthlyEstimate,
    data.monthlyEstimatePoH,
    data.outcomeTokenHoldingAllocation,
    data.pohUserAllocation,
    data.serLppMainnet,
    data.serLppGnosis,
    data.pctOfAirdrop,
  ].every((value) => !hasAmount(value));

  const pohLinkCard = isOwnProfile && connectedAccount ? <PohLinkCard account={connectedAccount} /> : null;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-black-primary">
          No estimated SEER for this profile yet. Amounts are across all chains and not claimable.
        </p>
        {pohLinkCard}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-black-primary">
        Holdings + Proof of Humanity to date, across all chains.{" "}
        <a className="font-semibold text-purple-primary" href="/leaderboard/airdrop">
          See how you rank
        </a>
        .
      </p>

      <MetricGroup
        title="To date"
        description="Holdings and Proof of Humanity add up to the total. Together they are half of the airdrop; the liquidity program is the other half, so a wallet with a tenth of the Proof of Humanity pool shows 2.5% of the airdrop."
        accent
      >
        <Figure tone="poh" label="Proof of Humanity (est.)" value={seerValue(data.pohUserAllocation)} />
        <Figure label="Holdings" value={seerValue(data.outcomeTokenHoldingAllocation)} />
        <Figure label="Total" value={seerValue(data.totalAllocation)} />
        <Figure tone="poh" label="% of airdrop" value={formatPct(data.pctOfAirdrop)} />
      </MetricGroup>

      <p className="text-xs text-black-secondary max-w-prose">{POH_ESTIMATE_NOTE}</p>

      {pohLinkCard}

      <MetricGroup title="30-day estimate" description="Projected from the latest snapshot. Not part of the total.">
        <Figure tone="poh" label="Proof of Humanity (est.)" value={seerValue(data.monthlyEstimatePoH)} />
        <Figure label="Holdings" value={seerValue(data.monthlyEstimate)} />
      </MetricGroup>

      <MetricGroup title="Liquidity" description="SER LP token balances, not SEER. Separate from the estimate above.">
        <Figure label="Ethereum" value={formatSeer(data.serLppMainnet)} />
        <Figure label="Gnosis" value={formatSeer(data.serLppGnosis)} />
      </MetricGroup>
    </div>
  );
}
