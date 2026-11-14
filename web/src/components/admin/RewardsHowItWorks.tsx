import Button from "@/components/Form/Button";
import type { ReactNode } from "react";

const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: "1. A manager creates a campaign",
    body: (
      <>
        <p>
          A campaign pays one reward token, at a weekly rate, to the liquidity providers of one Uniswap V4 pool. It
          lives in the RewardCampaigns registry of the pool's chain and pays out on that chain, in that chain's reward
          token (each chain has its own bridged SER-LP).
        </p>
        <p>
          The manager deposits the whole budget into the registry when it creates the campaign, and the campaign starts
          paying from that block. The registry holds it in escrow: nothing reaches liquidity providers until the bot
          releases what was earned.
        </p>
      </>
    ),
  },
  {
    title: "2. Liquidity providers earn every second",
    body: (
      <>
        <p>
          Each second, the campaign's rate is split by liquidity among the positions that are in range (lower tick ≤
          current tick &lt; upper tick). A position earns only if it was opened through the Uniswap PositionManager and
          is at least the campaign's minimum width. Limit orders held by the hook do not earn.
        </p>
        <p>
          Seconds with no eligible liquidity in range pay nothing and spend no budget. Rewards go to whoever owned the
          position NFT at the time, and once the budget is spent the campaign pays nothing more.
        </p>
      </>
    ),
  },
  {
    title: "3. Every Monday the bot publishes the week",
    body: (
      <>
        <p>
          Weeks close on Monday 00:00 UTC. An hour later, once the blocks before the cutoff are final, the bot replays
          the pools' events up to the cutoff and works out how much each wallet has earned in total.
        </p>
        <p>
          It then has the registry release what every campaign emitted to the chain's rewards distributor, uploads the
          results to IPFS and submits their Merkle root. The root becomes claimable after the distributor's timelock (48
          hours), which leaves time to revoke a wrong one.
        </p>
      </>
    ),
  },
  {
    title: "4. Liquidity providers claim",
    body: (
      <p>
        Each wallet claims from Portfolio → Rewards, on the pool's chain. Amounts add up week after week and never
        expire, so a wallet can claim whenever it wants.
      </p>
    ),
  },
  {
    title: "5. The funder adjusts its running campaign",
    body: (
      <>
        <p>
          Only the wallet that funded a campaign, or the registry's owner, can change its rate. A new rate applies from
          the block it is set in, and setting it to 0 ends the campaign for good.
        </p>
        <p>
          The budget and the minimum width never change: to add rewards to a pool, or to pay a different width, create
          another campaign on it. Campaigns on the same pool pay at the same time, so their rates add up.
        </p>
      </>
    ),
  },
  {
    title: "6. Unspent budget goes back to the funder",
    body: (
      <p>
        Once a campaign has ended, any wallet can send its refund, which goes back to the wallet that funded it. It
        sends at once what the campaign can no longer emit. What it may have emitted since the last weekly release stays
        in escrow until the bot releases the week it ended in, and what it did not emit can then be refunded too.
      </p>
    ),
  },
];

/** End-to-end explanation of liquidity reward campaigns, for the admin page. */
export function RewardsHowItWorks({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-5 text-[14px]">
      {STEPS.map((step) => (
        <section key={step.title} className="space-y-2">
          <h4 className="font-semibold text-[16px]">{step.title}</h4>
          <div className="space-y-2 text-base-content/80">{step.body}</div>
        </section>
      ))}
      <div className="flex justify-center pt-2">
        <Button text="Got it" type="button" onClick={onClose} />
      </div>
    </div>
  );
}
