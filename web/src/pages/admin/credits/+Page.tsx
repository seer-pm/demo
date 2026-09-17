import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import Toggle from "@/components/Form/Toggle";
import Popover from "@/components/Popover";
import { CreditCampaignFormContent } from "@/components/admin/CreditCampaignForm";
import {
  type AdminCreditCampaign,
  type AdminCreditCard,
  type CreditCampaignPayload,
  type CreditsDistributor,
  emptyCreditCampaignForm,
  fetchAdminCreditCampaignCards,
  useAdminCreditCampaignCards,
  useAdminCreditCampaigns,
  useRetryCreditCard,
  useSetCreditCampaignActive,
} from "@/hooks/admin/useAdminCreditCampaigns";
import { useIsAdmin } from "@/hooks/admin/useAdminMarketEvents";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useModal } from "@/hooks/useModal";
import { useSignIn } from "@/hooks/useSignIn";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { downloadCardsCsv, downloadCardsQrZip } from "@/lib/credit-cards-export";
import { QuestionIcon } from "@/lib/icons";
import { toastError } from "@/lib/toastify";
import { isAccessTokenExpired, shortenAddress } from "@/lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import { useState } from "react";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";

const LOW_GAS_XDAI = 0.5;

const explorerUrl = SUPPORTED_CHAINS[gnosis.id]?.blockExplorers?.default?.url ?? "https://gnosisscan.io";

function formatAmount(value: string | number | null, maximumFractionDigits = 2) {
  if (value === null) return "—";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits });
}

function TxLink({ hash, label }: { hash: string | null; label: string }) {
  if (!hash) return <>{label}</>;
  return (
    <a
      href={`${explorerUrl}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-primary hover:underline"
    >
      {label}
    </a>
  );
}

function DistributorPanel({ distributor }: { distributor: CreditsDistributor }) {
  if (distributor.error || !distributor.address) {
    return (
      <Alert type="error" title="Distributor wallet unavailable">
        {distributor.error ?? "CREDIT_CARDS_DISTRIBUTOR_PRIVATE_KEY is not configured."}
      </Alert>
    );
  }

  const credits = Number(distributor.credits);
  const owed = Number(distributor.owedCredits);
  const xdai = Number(distributor.xdai);

  return (
    <div className="card shadow-sm border border-separator-100 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Distributor wallet</h2>
        <a
          href={`${explorerUrl}/address/${distributor.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-purple-primary hover:underline break-all"
        >
          {distributor.address}
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-base-content/60">Credits balance</p>
          <p className="text-xl font-semibold">{formatAmount(distributor.credits)}</p>
        </div>
        <div>
          <p className="text-sm text-base-content/60">Owed to cards</p>
          <p className="text-xl font-semibold">{formatAmount(distributor.owedCredits)}</p>
          <p className="text-[12px] text-base-content/60">In-flight claims + unclaimed cards of active campaigns</p>
        </div>
        <div>
          <p className="text-sm text-base-content/60">xDAI (gas + drips)</p>
          <p className="text-xl font-semibold">{formatAmount(distributor.xdai, 4)}</p>
        </div>
      </div>
      {credits < owed && (
        <Alert type="warning" title="Not enough credits">
          The distributor holds fewer credits than active campaigns may claim. Claims are refused once the balance runs
          out; top it up with at least {formatAmount(owed - credits)} credits.
        </Alert>
      )}
      {xdai < LOW_GAS_XDAI && (
        <Alert type="warning" title="Low xDAI">
          The distributor pays gas for every transfer and sends xDAI drips to new wallets.
        </Alert>
      )}
    </div>
  );
}

function IssuesLegend() {
  return (
    <div className="text-[12px] space-y-2 font-normal normal-case text-left">
      <p>Claimed cards whose delivery has not finished well.</p>
      <p>
        <strong>In flight</strong>: the credits transfer is pending or sent but not confirmed on-chain yet. Normal right
        after a claim. If it stays high for several minutes, deliveries are stuck: the distributor may be out of credits
        or xDAI, or the RPC is failing. Only the credits transfer counts here, not the xDAI drip.
      </p>
      <p>
        <strong>Failed</strong>: the credits or the xDAI drip transaction reverted. These are not retried automatically:
        open Claims, check the error (hover the status) and press Retry.
      </p>
    </div>
  );
}

function statusLabel(card: AdminCreditCard) {
  if (card.status === "failed") return "Failed";
  if (card.status === "confirmed") return "Delivered";
  if (card.status === "sent") return "Sent";
  return "Pending";
}

function CampaignCardsContent({ campaign, onClose }: { campaign: AdminCreditCampaign; onClose: () => void }) {
  const { data: cards = [], isLoading } = useAdminCreditCampaignCards(campaign.id);
  const retryCard = useRetryCreditCard();
  const claimed = cards.filter((card) => card.status !== "unclaimed");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="shimmer-container h-40 rounded-lg" />
        <div className="flex justify-end">
          <Button text="Close" type="button" variant="secondary" onClick={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        {campaign.claimed_count} of {campaign.card_count} cards claimed · ${formatAmount(campaign.claimed_usd)} of $
        {formatAmount(campaign.total_usd)} · {formatAmount(campaign.confirmed_credits)} credits delivered
      </p>
      <div className="overflow-x-auto max-h-[60vh]">
        <table className="simple-table w-full">
          <thead>
            <tr>
              <th>Serial</th>
              <th>Claimed</th>
              <th>Wallet</th>
              <th>USD</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Gas drip</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {claimed.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-base-content/60 py-8">
                  No cards claimed yet.
                </td>
              </tr>
            )}
            {claimed.map((card) => (
              <tr key={card.id}>
                <td className="whitespace-nowrap font-mono text-sm">{card.serial}</td>
                <td className="whitespace-nowrap">
                  {card.claimed_at ? formatInTimeZone(new Date(card.claimed_at), "UTC", "yyyy-MM-dd HH:mm") : "—"}
                </td>
                <td className="whitespace-nowrap font-mono text-sm">
                  {card.claimed_by && (
                    <a
                      href={`${explorerUrl}/address/${card.claimed_by}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-primary hover:underline"
                    >
                      {shortenAddress(card.claimed_by)}
                    </a>
                  )}
                </td>
                <td>${card.amount_usd}</td>
                <td>{formatAmount(card.credits)}</td>
                <td className="whitespace-nowrap" title={card.error ?? undefined}>
                  <TxLink hash={card.tx_hash} label={statusLabel(card)} />
                </td>
                <td className="whitespace-nowrap">
                  {card.drip_status === "none" ? "—" : <TxLink hash={card.drip_tx_hash} label={card.drip_status} />}
                </td>
                <td>
                  {(card.status === "failed" || card.drip_status === "failed") && (
                    <button
                      type="button"
                      className="text-purple-primary hover:underline disabled:opacity-50"
                      disabled={retryCard.isPending}
                      onClick={() => retryCard.mutate(card.id)}
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button text="Close" type="button" variant="secondary" onClick={onClose} />
      </div>
    </div>
  );
}

function AdminCreditsPage() {
  const isSignedIn = useIsConnectedAndSignedIn();
  const { address, chainId } = useAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  const signIn = useSignIn();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data, isLoading: isCampaignsLoading } = useAdminCreditCampaigns(isAdmin === true);
  const setActive = useSetCreditCampaignActive();

  const { Modal: FormModal, openModal: openFormModal, closeModal: closeFormModal } = useModal("credit-campaign-form");
  const {
    Modal: CardsModal,
    openModal: openCardsModal,
    closeModal: closeCardsModal,
  } = useModal("credit-campaign-cards");

  const [formInitial, setFormInitial] = useState<CreditCampaignPayload>(emptyCreditCampaignForm);
  const [formKey, setFormKey] = useState(0);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const openForm = (initial: CreditCampaignPayload) => {
    setFormInitial(initial);
    setFormKey((key) => key + 1);
    openFormModal();
  };

  const openCards = (campaign: AdminCreditCampaign) => {
    setSelectedCampaignId(campaign.id);
    openCardsModal();
  };

  const exportCampaign = async (campaign: AdminCreditCampaign, format: "csv" | "zip") => {
    setExporting(`${campaign.id}-${format}`);
    try {
      const cards = await fetchAdminCreditCampaignCards(accessToken, campaign.id);
      if (format === "csv") {
        downloadCardsCsv(campaign.name, cards);
      } else {
        await downloadCardsQrZip(campaign.name, cards);
      }
    } catch (error) {
      toastError({ title: error instanceof Error ? error.message : "Export failed" });
    } finally {
      setExporting(null);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container-fluid py-12">
        <h1 className="text-2xl font-semibold mb-4">Credit Cards Admin</h1>
        <p className="text-base-content/70 mb-4">Connect your wallet and sign in to manage credit card campaigns.</p>
        {!address && <p className="text-sm">Use the Connect Wallet button in the header.</p>}
        {address && chainId && isAccessTokenExpired(accessToken) && (
          <Button
            text="Sign in"
            type="button"
            disabled={signIn.isPending}
            onClick={() => signIn.mutate({ address, chainId })}
          />
        )}
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="container-fluid py-12">
        <div className="shimmer-container h-64 rounded-lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-fluid py-12">
        <h1 className="text-2xl font-semibold mb-4">Credit Cards Admin</h1>
        <p className="text-base-content/70">Your wallet is not authorized to manage credit card campaigns.</p>
      </div>
    );
  }

  const campaigns = data?.campaigns ?? [];
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  return (
    <div className="container-fluid py-12 space-y-6">
      <FormModal
        className="max-w-[560px]"
        title="New campaign"
        content={<CreditCampaignFormContent key={formKey} initial={formInitial} onClose={closeFormModal} />}
      />
      <CardsModal
        className="max-w-[1000px]"
        title={selectedCampaign?.name ?? "Campaign"}
        content={selectedCampaign && <CampaignCardsContent campaign={selectedCampaign} onClose={closeCardsModal} />}
      />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Credit Cards Admin</h1>
        <Button text="New campaign" type="button" onClick={() => openForm(emptyCreditCampaignForm)} />
      </div>

      {data?.distributor && <DistributorPanel distributor={data.distributor} />}

      <div className="card shadow-sm border border-separator-100 overflow-x-auto">
        <table className="simple-table w-full">
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Range</th>
              <th>Claimed</th>
              <th>Delivered</th>
              <th>
                <span className="inline-flex items-center gap-1">
                  Issues
                  <Popover
                    label="What the Issues column means"
                    width={320}
                    trigger={
                      <span className="inline-flex size-4 items-center justify-center [&>svg]:size-4" aria-hidden>
                        <QuestionIcon fill="currentColor" />
                      </span>
                    }
                    content={<IssuesLegend />}
                  />
                </span>
              </th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isCampaignsLoading && (
              <tr>
                <td colSpan={8}>
                  <div className="shimmer-container h-10 rounded" />
                </td>
              </tr>
            )}
            {!isCampaignsLoading && campaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-base-content/60 py-8">
                  No campaigns yet.
                </td>
              </tr>
            )}
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="whitespace-nowrap">
                  {formatInTimeZone(new Date(campaign.created_at), "UTC", "yyyy-MM-dd")}
                </td>
                <td>{campaign.name}</td>
                <td className="whitespace-nowrap">
                  ${campaign.min_usd}–${campaign.max_usd}
                </td>
                <td className="whitespace-nowrap">
                  {campaign.claimed_count}/{campaign.card_count}
                  <span className="text-base-content/60">
                    {" "}
                    (${formatAmount(campaign.claimed_usd)} / ${formatAmount(campaign.total_usd)})
                  </span>
                </td>
                <td className="whitespace-nowrap">{formatAmount(campaign.confirmed_credits)} credits</td>
                <td className="whitespace-nowrap">
                  {campaign.in_flight_count > 0 && <span className="mr-2">{campaign.in_flight_count} in flight</span>}
                  {campaign.failed_count > 0 && (
                    <span className="text-error-primary">{campaign.failed_count} failed</span>
                  )}
                  {campaign.in_flight_count === 0 && campaign.failed_count === 0 && "—"}
                </td>
                <td>
                  <Toggle
                    checked={campaign.active}
                    disabled={setActive.isPending}
                    onChange={(e) => setActive.mutate({ id: campaign.id, active: e.target.checked })}
                  />
                </td>
                <td className="whitespace-nowrap space-x-3">
                  <button
                    type="button"
                    className="text-purple-primary hover:underline"
                    onClick={() => openCards(campaign)}
                  >
                    Claims
                  </button>
                  <button
                    type="button"
                    className="text-purple-primary hover:underline disabled:opacity-50"
                    disabled={exporting !== null}
                    onClick={() => exportCampaign(campaign, "csv")}
                  >
                    {exporting === `${campaign.id}-csv` ? "Exporting…" : "CSV"}
                  </button>
                  <button
                    type="button"
                    className="text-purple-primary hover:underline disabled:opacity-50"
                    disabled={exporting !== null}
                    onClick={() => exportCampaign(campaign, "zip")}
                  >
                    {exporting === `${campaign.id}-zip` ? "Exporting…" : "QR ZIP"}
                  </button>
                  <button
                    type="button"
                    className="text-purple-primary hover:underline"
                    onClick={() =>
                      openForm({
                        name: `${campaign.name} (copy)`,
                        cardCount: campaign.card_count,
                        minUsd: campaign.min_usd,
                        maxUsd: campaign.max_usd,
                      })
                    }
                  >
                    Duplicate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminCreditsPage;
