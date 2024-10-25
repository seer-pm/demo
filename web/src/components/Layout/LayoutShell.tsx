import { Buffer } from "buffer";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import { ToastContainer } from "react-toastify";
import { WagmiProvider } from "wagmi";
import { persister, queryClient } from "../../lib/query-client.ts";
import { config } from "../../wagmi.ts";
import { SwapUpdater } from "../SwapUpdater.tsx";

import "react-toastify/dist/ReactToastify.css";
import "../../index.scss";
import { Query, defaultShouldDehydrateQuery } from "@tanstack/react-query";

globalThis.Buffer = Buffer;

export default function Layout({ children }: { children: React.ReactNode }) {
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
                if (defaultShouldDehydrateQuery(query) && query.queryHash.includes("usePositions")) {
                  return true;
                }
                if (defaultShouldDehydrateQuery(query) && query.queryHash.includes("useHistoryTransactions")) {
                  return true;
                }
                if (defaultShouldDehydrateQuery(query) && query.queryHash.includes("useOddChartData")) {
                  return true;
                }
                return false;
              },
            },
          }}
        >
          <SwapUpdater />
          <ToastContainer />
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  );
}
