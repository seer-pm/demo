import { Link } from "@/components/Link";
import { useUserLimitOrders } from "@/hooks/limitOrders/useUserLimitOrders";
import { filterChain } from "@/lib/chains";
import { toastInfo } from "@/lib/toastify";
import { chainSupportsOrderBook } from "@seer-pm/order-book";
import type { SupportedChain } from "@seer-pm/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

const WELCOME_TOAST_SESSION_KEY = "seer:filledOrdersWelcomeToast";
const TOAST_OPTIONS = { autoClose: 10_000 as const };

// Already on another portfolio tab, "Go to Portfolio" names the page the user is on; name the tab instead.
function ordersLink(chainId: SupportedChain, onPortfolio: boolean) {
  return (
    <Link to={`/portfolio?tab=orders&chain=${chainId}`} className="underline">
      {onPortfolio ? "Open Limit Orders to withdraw" : "Go to Portfolio to withdraw"}
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
  const { urlParsed } = usePageContext();
  // On the orders tab the filled orders are already on screen, so a link would point at the page the
  // user is reading. Kept in refs so navigating does not re-run the fill check.
  const onPortfolioRef = useRef(false);
  const onOrdersTabRef = useRef(false);
  onPortfolioRef.current = urlParsed.pathname.startsWith("/portfolio");
  onOrdersTabRef.current = onPortfolioRef.current && urlParsed.search.tab === "orders";

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
        if (onOrdersTabRef.current) return;
        const count = filledIds.size;
        toastInfo({
          title:
            count === 1
              ? "You have 1 filled order ready to withdraw"
              : `You have ${count} filled orders ready to withdraw`,
          subtitle: ordersLink(chainId, onPortfolioRef.current),
          options: TOAST_OPTIONS,
        });
      }
      return;
    }

    const newCount = [...filledIds].filter((id) => !seenFilledIdsRef.current!.has(id)).length;
    seenFilledIdsRef.current = filledIds;

    if (newCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["limitOrderHookUserOrders"] });
      // Filled orders leave the pool, so the liquidity chart changes too.
      queryClient.invalidateQueries({ queryKey: ["useTicksData"] });
      toastInfo({
        title: newCount === 1 ? "1 order just filled" : `${newCount} orders just filled`,
        subtitle: onOrdersTabRef.current
          ? newCount === 1
            ? "It's ready to withdraw in the list below."
            : "They're ready to withdraw in the list below."
          : ordersLink(chainId, onPortfolioRef.current),
        options: TOAST_OPTIONS,
      });
    }
  }, [address, chainId, data, queryClient]);

  return null;
}
