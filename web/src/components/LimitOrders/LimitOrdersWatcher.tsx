import { Link } from "@/components/Link";
import { useUserLimitOrders } from "@/hooks/limitOrders/useUserLimitOrders";
import { filterChain } from "@/lib/chains";
import { toastInfo } from "@/lib/toastify";
import { chainSupportsOrderBook } from "@seer-pm/order-book";
import type { SupportedChain } from "@seer-pm/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

const WELCOME_TOAST_SESSION_KEY = "seer:filledOrdersWelcomeToast";
const PORTFOLIO_ORDERS_PATH = "/portfolio?tab=orders";
const TOAST_OPTIONS = { autoClose: 10_000 as const };

function portfolioLink() {
  return (
    <Link to={PORTFOLIO_ORDERS_PATH} className="underline">
      Go to Portfolio to withdraw
    </Link>
  );
}

export function LimitOrdersWatcher() {
  const { address, chainId: rawChainId } = useAccount();
  const chainId: SupportedChain = filterChain(rawChainId);
  const orderBookSupported = chainSupportsOrderBook(chainId);
  const queryClient = useQueryClient();
  const { data } = useUserLimitOrders(orderBookSupported ? address : undefined, chainId);
  const seenFilledIdsRef = useRef<Set<string> | null>(null);
  const accountKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const accountKey = address ? `${chainId}:${address.toLowerCase()}` : null;

    if (!accountKey || !data) {
      if (!accountKey) {
        seenFilledIdsRef.current = null;
        accountKeyRef.current = null;
      }
      return;
    }

    if (accountKeyRef.current !== accountKey) {
      seenFilledIdsRef.current = null;
      accountKeyRef.current = accountKey;
    }

    const filledIds = new Set(data.filled.map((order) => order.id));

    if (seenFilledIdsRef.current === null) {
      seenFilledIdsRef.current = filledIds;

      const welcomeKey = `${WELCOME_TOAST_SESSION_KEY}:${accountKey}`;
      if (filledIds.size > 0 && !sessionStorage.getItem(welcomeKey)) {
        sessionStorage.setItem(welcomeKey, "1");
        const count = filledIds.size;
        toastInfo({
          title:
            count === 1
              ? "You have 1 filled order ready to withdraw"
              : `You have ${count} filled orders ready to withdraw`,
          subtitle: portfolioLink(),
          options: TOAST_OPTIONS,
        });
      }
      return;
    }

    const newCount = [...filledIds].filter((id) => !seenFilledIdsRef.current!.has(id)).length;
    seenFilledIdsRef.current = filledIds;

    if (newCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["limitOrderHookUserOrders"] });
      toastInfo({
        title: newCount === 1 ? "1 order just filled" : `${newCount} orders just filled`,
        subtitle: portfolioLink(),
        options: TOAST_OPTIONS,
      });
    }
  }, [address, chainId, data, queryClient]);

  return null;
}
