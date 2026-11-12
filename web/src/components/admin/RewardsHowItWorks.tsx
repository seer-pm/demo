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
          The whole budget is deposited into the registry when the campaign is created, and the campaign starts paying
          from that block. The registry holds it in escrow: nothing reaches liquidity providers until the bot releases
          what was earned.
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
          current tick &lt; upper tick). A position earns only if it was opened through the Uniswap PositionManager, is
          at least the campaign's minimum width, and is not excluded. Limit orders held by the hook do not earn.
        </p>
        <p>
          Seconds with no eligible liquidity in range pay nothing and spend no budget. Rewards go to whoever owned the
          position NFT at the time, and once the budget is spent the campaign pays nothing more until funds are added.
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
    title: "5. Managers adjust running campaigns",
    body: (
      <>
        <p>
          A new rate applies from the block it is set in. Setting it to 0 ends the campaign, and Restart gives an ended
          campaign a new rate from that moment.
        </p>
        <p>
          Managers can also add funds. The budget and the settings (minimum width and excluded positions) that the
          registry holds at a Monday cutoff apply to the whole week that ends there.
        </p>
      </>
    ),
  },
  {
    title: "6. Unspent budget goes back to the depositors",
    body: (
      <p>
        Once a campaign has ended and the bot has released its final week, any wallet can settle its refund. That
        credits what the campaign did not emit to the wallets that deposited it, in proportion to their deposits. Each
        wallet then withdraws its own credit under Your refunds on this page.
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
