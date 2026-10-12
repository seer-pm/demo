import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import LayoutShell from "@/components/Layout/LayoutShell";
import React from "react";
import { PageIntro } from "./PageIntro";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShell>
      <a href="#main-content" className="seer-skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="seer-main">
        <PageIntro />
        {children}
      </main>
      <Footer />
    </LayoutShell>
  );
}
