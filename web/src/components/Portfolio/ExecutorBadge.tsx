import { shortenAddress } from "@/lib/utils";
import type { Address } from "viem";
import Popover from "../Popover";

/**
 * Marks a row that belongs to a TradeExecutor the profile owner controls, rather than to the wallet
 * address itself.
 *
 * A user trading through an executor holds the outcome tokens inside that contract, so without the
 * label the merged portfolio would silently claim the EOA holds them — which matters the moment
 * someone tries to redeem.
 *
 * Deliberately the one identity surface that keeps a short address instead of resolving a display
 * name through `DisplayName`: `wallet` is a contract, so it has no Seer username and no ENS name,
 * and the generated-nickname fallback would dress a contract up as a person. Here the address is
 * the useful information.
 */
export function ExecutorBadge({ wallet }: { wallet: Address }) {
  return (
    <Popover
      label={`Executed by Trade Executor ${shortenAddress(wallet)}`}
      width={260}
      trigger={
        <span className="text-xs text-purple-primary font-medium whitespace-nowrap border border-purple-primary rounded-[2px] px-1 py-[1px] shrink-0">
          via Trade Executor
        </span>
      }
      content={
        <div className="text-[14px] space-y-1">
          <p>This went through a Trade Executor contract you own, not directly from your wallet.</p>
          <p className="text-black-secondary break-all">{wallet}</p>
        </div>
      }
    />
  );
}
