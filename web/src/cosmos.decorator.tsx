import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { HashRouter } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { WagmiProvider } from "wagmi";
import "./index.scss";

export default ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <HashRouter>{children}</HashRouter>
    </QueryClientProvider>
  </WagmiProvider>
);
