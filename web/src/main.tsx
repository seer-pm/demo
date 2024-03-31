import { Buffer } from "buffer";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { WagmiProvider } from "wagmi";
import App from "./App.tsx";
import { SwapUpdater } from "./components/SwapUpdater.tsx";
import { queryClient } from "./lib/query-client.ts";
import { config } from "./wagmi.ts";

import "react-toastify/dist/ReactToastify.css";
import "./index.scss";

globalThis.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
        <SwapUpdater />
        <ToastContainer />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
