import { AirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { isTwoStringsEqual } from "@/lib/utils";
import type { ReactNode } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { formatSeer, hasAmount, seerValue } from "./airdropFormat";

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
      <dt className={`text-sm font-medium ${poh ? "text-purple-primary" : "text-black-primary"}`}>{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tabular-nums ${poh ? "text-purple-primary" : "text-base-content"}`}>
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
          ? "bg-purple-medium dark:bg-base-200 rounded-[3px] px-4 py-5 sm:px-5 border border-purple-primary/20"
          : undefined
      }
    >
      <h3 className={`text-sm font-semibold ${accent ? "text-purple-primary" : "text-base-content"}`}>{title}</h3>
      <p className="text-sm text-black-primary mt-1 mb-4 max-w-prose">{description}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">{children}</dl>
    </section>
  );
}

function PohRegisterCallout({ href }: { href: string }) {
  return (
    <div className="bg-purple-medium dark:bg-base-200 rounded-[3px] px-4 py-5 sm:px-5 space-y-3">
      <p className="text-sm text-black-primary">
        Proof of Humanity verifies you are a unique person. Register for additional SEER.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-[4px] bg-purple-primary text-white text-[14px] px-4 py-[10px] min-h-11"
      >
        Register on Proof of Humanity
      </a>
    </div>
  );
}

export default function AirdropTable({ data, account }: { data: AirdropDataByUser; account?: Address }) {
  const { address: connectedAccount } = useAccount();

  const isOwnProfile = isTwoStringsEqual(connectedAccount, account);
  const hasPoh = hasAmount(data.pohUserAllocation) || hasAmount(data.monthlyEstimatePoH);
  const isEmpty = [
    data.totalAllocation,
    data.monthlyEstimate,
    data.monthlyEstimatePoH,
    data.outcomeTokenHoldingAllocation,
    data.pohUserAllocation,
    data.serLppMainnet,
    data.serLppGnosis,
  ].every((value) => !hasAmount(value));

  const pohShare =
    hasAmount(data.totalAllocation) && hasAmount(data.pohUserAllocation)
      ? Math.round((data.pohUserAllocation / data.totalAllocation) * 100)
      : null;

  const pohRegisterHref = connectedAccount
    ? `https://v2.proofofhumanity.id/${connectedAccount.replace(/^0x/, "")}/claim`
    : "https://v2.proofofhumanity.id";

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-black-primary">
          No estimated SEER for this profile yet. Amounts are across all chains and not claimable.
        </p>
        {isOwnProfile ? <PohRegisterCallout href={pohRegisterHref} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-black-primary">
        Holdings + Proof of Humanity to date, across all chains.
        {pohShare != null && pohShare > 0 ? ` Proof of Humanity is ${pohShare}% of this estimate.` : null}
      </p>

      <MetricGroup title="To date" description="These two add up to the total." accent>
        <Figure tone="poh" label="Proof of Humanity" value={seerValue(data.pohUserAllocation)} />
        <Figure label="Holdings" value={seerValue(data.outcomeTokenHoldingAllocation)} />
      </MetricGroup>

      {isOwnProfile && !hasPoh ? <PohRegisterCallout href={pohRegisterHref} /> : null}

      <MetricGroup title="30-day estimate" description="Projected from the latest snapshot. Not part of the total.">
        <Figure tone="poh" label="Proof of Humanity" value={seerValue(data.monthlyEstimatePoH)} />
        <Figure label="Holdings" value={seerValue(data.monthlyEstimate)} />
      </MetricGroup>

      <MetricGroup title="Liquidity" description="SER LP token balances, not SEER. Separate from the estimate above.">
        <Figure label="Ethereum" value={formatSeer(data.serLppMainnet)} />
        <Figure label="Gnosis" value={formatSeer(data.serLppGnosis)} />
      </MetricGroup>
    </div>
  );
}
