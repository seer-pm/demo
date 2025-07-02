import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import LayoutShell from "@/components/Layout/LayoutShell";
import { GNOSIS_RPC } from "@/wagmi";
import { ChainId, configureRpcProviders } from "@swapr/sdk";
import React, { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureRpcProviders({
      [ChainId.XDAI]: GNOSIS_RPC,
    });
  }, []);
  return (
    // <Suspense>
    <LayoutShell>
      <Header />
      <div>{children}</div>
      <Footer />
    </LayoutShell>
    // </Suspense>
  );
}
