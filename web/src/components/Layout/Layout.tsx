import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import LayoutShell from "@/components/Layout/LayoutShell";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // <Suspense>
    <LayoutShell>
      <ThemeInitializer />
      <Header />
      <div>{children}</div>
      <Footer />
    </LayoutShell>
    // </Suspense>
  );
}
