import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import { CreateRewardCampaignForm, RewardRatesForm, RewardRefundForm } from "@/components/admin/RewardCampaignForms";
import { RewardsHowItWorks } from "@/components/admin/RewardsHowItWorks";
import {
  REGISTRY_CHAINS,
  type RewardCampaign,
  useRewardCampaignManagerChains,
  useRewardCampaigns,
} from "@/hooks/admin/useRewardCampaigns";
import { useModal } from "@/hooks/useModal";
import { campaignStatus, chainName, formatWeekly, refundState, toDate } from "@/lib/reward-campaigns";
import { shortenAddress } from "@/lib/utils";
import { getV4PoolExplorerUrl } from "@seer-pm/order-book";
import { useState } from "react";
import { type Address, formatUnits, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

type ActionKind = "rate" | "end" | "refund";
type Action = { kind: ActionKind; campaign: RewardCampaign };

const ACTION_TITLES: Record<ActionKind, string> = {
  rate: "Change rate",
  end: "End",
  refund: "Refund",
};

function CampaignRow({
  campaign,
  account,
  onAction,
}: {
  campaign: RewardCampaign;
  account: Address | undefined;
  onAction: (action: Action) => void;
}) {
  const status = campaignStatus(campaign.rates);
  // The registry lets only the campaign's funder and its own owner change a campaign.
  const canEdit =
    account !== undefined &&
    (isAddressEqual(campaign.funder, account) || isAddressEqual(campaign.registryOwner, account));
  const refund = refundState(campaign);
  const { token } = campaign;
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
      <td className="whitespace-nowrap">
        <a
          href={getV4PoolExplorerUrl(campaign.payoutChainId, campaign.poolId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-primary dark:text-purple-secondary hover:underline"
        >
          {`${campaign.poolId.slice(0, 10)}…${campaign.poolId.slice(-6)}`}
        </a>
      </td>
      <td className="whitespace-nowrap">{token?.symbol ?? shortenAddress(campaign.rewardToken)}</td>
      <td className="whitespace-nowrap">
        {shortenAddress(campaign.funder)}
        {account && isAddressEqual(campaign.funder, account) && " (you)"}
      </td>
      <td className="whitespace-nowrap">
        {/* An ended campaign shows the rate it paid last rather than its closing zero rate. */}
        {formatWeekly(status.lastPaid, token)}
      </td>
      <td className="whitespace-nowrap">
        <span className={status.ended ? "text-base-content/50" : "text-success-primary"}>
          {status.ended ? "ended" : "active"}
        </span>
        <div className="text-[12px] text-base-content/60">
          {toDate(status.start)} → {status.end !== undefined ? toDate(status.end) : "open"}
        </div>
      </td>
      <td className="whitespace-nowrap">
        {amount(campaign.released)} / {amount(campaign.budget)}
        <div className="text-[12px] text-base-content/60">
          {campaign.releasedUpTo > 0 ? `released up to ${toDate(campaign.releasedUpTo)}` : "nothing released yet"}
        </div>
      </td>
      <td className="whitespace-nowrap space-x-3">
        {canEdit && !status.ended && action("rate", "Change rate")}
        {canEdit && !status.ended && action("end", "End")}
        {/* A refund only goes to the funder, so any wallet may send it. */}
        {refund.kind === "ready" && action("refund", "Refund")}
        {refund.kind !== "none" && refund.held > 0n && (
          <div className="!ml-0 text-[12px] text-base-content/60">up to {amount(refund.held)} held until Monday</div>
        )}
      </td>
    </tr>
  );
}

function ActionForm({ action, onClose }: { action: Action; onClose: () => void }) {
  const { kind, campaign } = action;
  if (kind === "rate" || kind === "end") return <RewardRatesForm campaign={campaign} mode={kind} onClose={onClose} />;
  return <RewardRefundForm campaign={campaign} onClose={onClose} />;
}

function AdminRewardsPage() {
  const { address } = useAccount();
  const { data: campaigns = [], isLoading, error } = useRewardCampaigns();
  const { data: managerChains = [] } = useRewardCampaignManagerChains(address);
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
            out on that chain. Every Monday 00:00 UTC the rewards bot releases what each campaign emitted to the chain's
            distributor.{" "}
            <button
              type="button"
              className="text-purple-primary dark:text-purple-secondary hover:underline"
              onClick={openHelp}
            >
              How does it work?
            </button>
          </p>
        </div>
        {managerChains.length > 0 && (
          <Button
            text="New campaign"
            type="button"
            onClick={() => {
              setCreateKey((key) => key + 1);
              openCreate();
            }}
          />
        )}
      </div>

      {REGISTRY_CHAINS.length === 0 && (
        <Alert type="warning" title="No registry deployed">
          Deploy RewardCampaigns on a chain with pools (hardhat tag RewardCampaigns) and set its PAYOUT_CHAINS registry
          in packages/seer-pm-rewards/src/chains.ts.
        </Alert>
      )}
      {REGISTRY_CHAINS.length > 0 && !address && (
        <p className="text-sm">Connect a manager wallet to create or change campaigns.</p>
      )}
      {REGISTRY_CHAINS.length > 0 && address && managerChains.length === 0 && (
        <p className="text-sm text-base-content/70">
          {shortenAddress(address)} is not a manager of any registry, so it cannot create campaigns.
        </p>
      )}
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
              <th>Pool</th>
              <th>Reward</th>
              <th>Funder</th>
              <th>Rate</th>
              <th>Status (UTC)</th>
              <th>Released / budget</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8}>
                  <div className="shimmer-container h-10 rounded" />
                </td>
              </tr>
            )}
            {!isLoading && !error && campaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-base-content/60 py-8">
                  No campaigns yet.
                </td>
              </tr>
            )}
            {campaigns.map((campaign) => (
              <CampaignRow
                key={`${campaign.payoutChainId}-${campaign.id}`}
                campaign={campaign}
                account={address}
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
