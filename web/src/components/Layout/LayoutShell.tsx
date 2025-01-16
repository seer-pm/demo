import { Buffer } from "buffer";
import { HydrationBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import { ToastContainer } from "react-toastify";
import { usePageContext } from "vike-react/usePageContext";
import { WagmiProvider } from "wagmi";
import { persister, queryClient } from "../../lib/query-client.ts";
import { config } from "../../wagmi.ts";
import { SwapUpdater } from "../SwapUpdater.tsx";

import "react-toastify/dist/ReactToastify.css";
import "../../index.scss";
import { Query, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { AuthUpdater } from "../AuthUpdater.tsx";

globalThis.Buffer = Buffer;

export default function Layout({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const { dehydratedState } = pageContext;
  return (
    <React.StrictMode>
      <WagmiProvider config={config}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24, //24 hours
            dehydrateOptions: {
              shouldDehydrateQuery: (query: Query) => {
                if (defaultShouldDehydrateQuery(query) && query.queryHash.includes("useMarketOdds")) {
                  return true;
                }
                if (defaultShouldDehydrateQuery(query) && query.queryHash.includes("useGetHistoryBalances")) {
                  return true;
                }
                if (defaultShouldDehydrateQuery(query) && query.queryHash.includes("useHistoryTransactions")) {
                  return true;
                }
                if (defaultShouldDehydrateQuery(query) && query.queryHash.includes("useChartData")) {
                  return true;
                }
                return false;
              },
            },
          }}
        >
          <AuthUpdater />
          <SwapUpdater />
          <ToastContainer />
          <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
          <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  );
}
