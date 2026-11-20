import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import {
  CreateRewardCampaignForm,
  FundRewardCampaignForm,
  RewardRatesForm,
} from "@/components/admin/RewardCampaignForms";
import { RewardsHowItWorks } from "@/components/admin/RewardsHowItWorks";
import {
  type CampaignEmitted,
  REGISTRY_CHAINS,
  type RewardCampaign,
  useRewardCampaignManagerChains,
  useRewardCampaigns,
  useRewardCampaignsEmitted,
} from "@/hooks/admin/useRewardCampaigns";
import { useModal } from "@/hooks/useModal";
import { paths } from "@/lib/paths";
import { campaignStatus, chainName, formatWeekly, toDate } from "@/lib/reward-campaigns";
import { shortenAddress } from "@/lib/utils";
import { getV4PoolExplorerUrl } from "@seer-pm/order-book";
import { useState } from "react";
import { type Address, formatUnits, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

type ActionKind = "fund" | "rate" | "end";
type Action = { kind: ActionKind; campaign: RewardCampaign };

const ACTION_TITLES: Record<ActionKind, string> = {
  fund: "Fund",
  rate: "Change rate",
  end: "End",
};

const toDateTime = (t: number) => new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ");

function CampaignRow({
  campaign,
  emitted,
  account,
  canFund,
  onAction,
}: {
  campaign: RewardCampaign;
  /** Undefined while the estimate has not covered this campaign yet. */
  emitted: CampaignEmitted | undefined;
  account: Address | undefined;
  /** The campaign is not funded yet and `account` manages its chain's registry. */
  canFund: boolean;
  onAction: (action: Action) => void;
}) {
  const status = campaignStatus(campaign.rates);
  const canEdit = account !== undefined && isAddressEqual(campaign.funder, account);
  const { token, outcome } = campaign;
  const amount = (value: bigint) =>
    token
      ? Number(formatUnits(value, token.decimals)).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })
      : value.toString();
  const action = (kind: ActionKind, label: string) => (
    <button
      type="button"
      className="text-purple-primary dark:text-purple-secondary hover:underline"
      onClick={() => onAction({ kind, campaign })}
    >
      {label}
    </button>
  );

  return (
    <tr>
      <td className="whitespace-nowrap">
        {chainName(campaign.payoutChainId)} #{campaign.id.toString()}
      </td>
      <td className="max-w-[20rem]">
        {outcome ? (
          <>
            <div className="font-semibold">{outcome.name}</div>
            <a
              href={paths.market(outcome.marketId, campaign.payoutChainId)}
              title={outcome.marketName}
              className="block truncate text-[12px] text-base-content/70 hover:underline"
            >
              {outcome.marketName}
            </a>
          </>
        ) : (
          <div className="text-base-content/70">
            {campaign.poolCreated === false ? "Pool not created" : "Pool not indexed yet"}
          </div>
        )}
        <a
          href={getV4PoolExplorerUrl(campaign.payoutChainId, campaign.poolId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-purple-primary dark:text-purple-secondary hover:underline"
        >
          {`${campaign.poolId.slice(0, 10)}…${campaign.poolId.slice(-6)}`}
        </a>
      </td>
      <td className="whitespace-nowrap tabular-nums">
        {/* An ended campaign shows the rate it paid last rather than its closing zero rate. */}
        {token ? formatWeekly(status.lastPaid, token) : shortenAddress(campaign.rewardToken)}
        <div className="text-[12px] text-base-content/70">
          {campaign.funded ? "Funded by " : "Created by "}
          {shortenAddress(campaign.funder)}
          {account && isAddressEqual(campaign.funder, account) && " (you)"}
        </div>
      </td>
      <td className="whitespace-nowrap">
        <span className={status.ended ? "text-base-content/50" : "text-success-primary"}>
          {status.ended ? "ended" : "active"}
        </span>
        {!campaign.funded && <span className="text-warning-primary"> · not funded</span>}
        <div className="text-[12px] text-base-content/60">
          {toDate(status.start)} → {status.end !== undefined ? toDate(status.end) : "open"}
        </div>
      </td>
      <td className="whitespace-nowrap tabular-nums">
        {amount(campaign.released)} / {amount(campaign.budget)} {token?.symbol}
      </td>
      <td className="whitespace-nowrap tabular-nums">
        {emitted ? (
          <>
            {amount(emitted.amount)} {token?.symbol}
            <div className="text-[12px] text-base-content/60">estimate at {toDateTime(emitted.asOf)}</div>
          </>
        ) : (
          <span className="text-base-content/60">no estimate yet</span>
        )}
      </td>
      <td className="whitespace-nowrap space-x-3">
        {canFund && action("fund", "Fund")}
        {canEdit && !status.ended && action("rate", "Change rate")}
        {canEdit && !status.ended && action("end", "End")}
        {!campaign.funded && (
          <div className="text-[12px] text-base-content/60">What it earns is claimable once a manager funds it</div>
        )}
        {campaign.funded && status.ended && campaign.budget > campaign.released && (
          <div className="text-[12px] text-base-content/60">
            {amount(campaign.budget - campaign.released)} in escrow pending final settlement
          </div>
        )}
      </td>
    </tr>
  );
}

function ActionForm({ action, onClose }: { action: Action; onClose: () => void }) {
  const { kind, campaign } = action;
  if (kind === "fund") return <FundRewardCampaignForm campaign={campaign} onClose={onClose} />;
  return <RewardRatesForm campaign={campaign} mode={kind} onClose={onClose} />;
}

function AdminRewardsPage() {
  const { address } = useAccount();
  const { data: managerChains = [], isLoading: isManagerLoading } = useRewardCampaignManagerChains(address);
  const isManager = managerChains.length > 0;
  const { data: campaigns = [], isLoading, error } = useRewardCampaigns(isManager);
  // The estimate only adds a column, so a failure leaves the rest of the table as it is.
  const { data: emitted } = useRewardCampaignsEmitted(isManager);
  const { Modal: CreateModal, openModal: openCreate, closeModal: closeCreate } = useModal("reward-campaign-create");
  const {
    Modal: ActionModal,
    openModal: openActionModal,
    closeModal: closeAction,
  } = useModal("reward-campaign-action");
  const { Modal: HelpModal, openModal: openHelp, closeModal: closeHelp } = useModal("reward-campaigns-help", true);
  const [action, setAction] = useState<Action | null>(null);
  const [createKey, setCreateKey] = useState(0);

  const openAction = (next: Action) => {
    setAction(next);
    openActionModal();
  };
  const actionTitle = action
    ? `${ACTION_TITLES[action.kind]}: ${chainName(action.campaign.payoutChainId)} #${action.campaign.id}`
    : "";

  if (!isManager) {
    let message = "Connect a manager wallet to manage liquidity reward campaigns.";
    if (REGISTRY_CHAINS.length === 0) {
      message =
        "No RewardCampaigns registry is deployed. Deploy one (hardhat tag RewardCampaigns) and set its PAYOUT_CHAINS registry in packages/seer-pm-rewards/src/chains.ts.";
    } else if (address && isManagerLoading) {
      return (
        <div className="container-fluid py-12">
          <div className="shimmer-container h-64 rounded-lg" />
        </div>
      );
    } else if (address) {
      message = `${shortenAddress(address)} is not a manager of any rewards registry.`;
    }
    return (
      <div className="container-fluid py-12">
        <h1 className="text-2xl font-semibold mb-4">Liquidity Rewards Admin</h1>
        <p className="text-base-content/70">{message}</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-12 space-y-6">
      <CreateModal
        className="max-w-[640px]"
        title="New rewards campaign"
        content={<CreateRewardCampaignForm key={createKey} managerChains={managerChains} onClose={closeCreate} />}
      />
      <HelpModal
        className="max-w-[640px]"
        title="How do liquidity rewards work?"
        content={<RewardsHowItWorks onClose={closeHelp} />}
      />
      <ActionModal
        className="max-w-[520px]"
        title={actionTitle}
        content={
          action && (
            <ActionForm
              key={`${action.kind}-${action.campaign.payoutChainId}-${action.campaign.id}`}
              action={action}
              onClose={closeAction}
            />
          )
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Liquidity Rewards Admin</h1>
          <p className="text-sm text-base-content/70">
            Each chain's RewardCampaigns registry holds the campaigns of its pools and their budgets, and rewards pay
            out on that chain. Every Monday 00:00 UTC the rewards bot proposes what each campaign emitted, and the
            registry releases it to the chain's distributor once that root clears the timelock. What they emitted since
            is estimated every 2 hours.{" "}
            <button
              type="button"
              className="text-purple-primary dark:text-purple-secondary hover:underline"
              onClick={openHelp}
            >
              How does it work?
            </button>
          </p>
        </div>
        <Button
          text="New campaign"
          type="button"
          onClick={() => {
            setCreateKey((key) => key + 1);
            openCreate();
          }}
        />
      </div>

      {error && (
        <Alert type="error" title="Could not load campaigns">
          {error.message}
        </Alert>
      )}

      <div className="card shadow-sm border border-separator-100 overflow-x-auto">
        <table className="simple-table w-full">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Outcome pool</th>
              <th>Reward</th>
              <th>Status (UTC)</th>
              <th>Released / budget</th>
              <th>Emitted so far</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7}>
                  <div className="shimmer-container h-10 rounded" />
                </td>
              </tr>
            )}
            {!isLoading && !error && campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-base-content/60 py-8">
                  No campaigns yet.
                </td>
              </tr>
            )}
            {campaigns.map((campaign) => (
              <CampaignRow
                key={`${campaign.payoutChainId}-${campaign.id}`}
                campaign={campaign}
                emitted={emitted?.get(`${campaign.payoutChainId}-${campaign.id}`)}
                account={address}
                canFund={!campaign.funded && managerChains.includes(campaign.payoutChainId)}
                onAction={openAction}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminRewardsPage;
