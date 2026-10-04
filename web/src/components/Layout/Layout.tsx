import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import LayoutShell from "@/components/Layout/LayoutShell";
import { DESIGN_PREVIEW } from "@/lib/design-preview";
import React from "react";
import { PageIntro } from "./PageIntro";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShell>
      <a href="#main-content" className="seer-skip-link">Skip to content</a>
      <Header />
      {DESIGN_PREVIEW && <div className="seer-preview-notice" role="status">Design preview · Public market data · Wallet connections and transactions are disabled</div>}
      <main id="main-content" className="seer-main">
        <PageIntro />
        {children}
      </main>
      <Footer />
    </LayoutShell>
  );
}
