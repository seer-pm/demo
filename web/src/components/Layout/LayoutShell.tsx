import { Buffer } from "buffer";
import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { ToastContainer } from "react-toastify";
import { usePageContext } from "vike-react/usePageContext";
import { WagmiProvider } from "wagmi";
import { queryClient } from "../../lib/query-client.ts";
import { config } from "../../wagmi.ts";
import { SwapUpdater } from "../SwapUpdater.tsx";

import "react-toastify/dist/ReactToastify.css";
import "../../index.scss";
import { AuthUpdater } from "../AuthUpdater.tsx";

globalThis.Buffer = Buffer;

export default function Layout({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const { dehydratedState } = pageContext;
  return (
    <React.StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AuthUpdater />
          <SwapUpdater />
          <ToastContainer />
          <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  );
}
