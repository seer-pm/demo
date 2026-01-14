import { Buffer } from "buffer";
import { useTheme } from "@/hooks/useTheme";
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

  if (!useTheme?.persist?.hasHydrated()) {
    // Wait for theme store to hydrate from localStorage before rendering
    // This prevents the flash of incorrect theme (light mode) when user has dark mode saved
    return null;
  }

  return (
    <React.StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AuthUpdater />
          <SwapUpdater />
          <ToastContainer />
          <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
          <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  );
}
