import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import LayoutShell from "@/components/Layout/LayoutShell";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // <Suspense>
    <LayoutShell>
      <Header />
      <main>{children}</main>
      <Footer />
    </LayoutShell>
    // </Suspense>
  );
}
