import type { Metadata } from "next";
import "@subboost/ui/styles/globals.css";
import "../src/styles/edge-light.css";
import { ConfirmDialogHost } from "@subboost/ui/components/ui/confirm-dialog";
import { ScrollLockStabilizer } from "@subboost/ui/components/layout/scroll-lock-stabilizer";
import { Toaster } from "@subboost/ui/components/ui/toaster";
import { EdgeFooter } from "@edge/components/edge-footer";
import { EdgeHeader } from "@edge/components/edge-header";
import { EdgeMobileNav } from "@edge/components/edge-mobile-nav";

export const metadata: Metadata = {
  title: "EdgeSub",
  description: "Cloudflare Edge 上的 Clash 与 Mihomo 订阅工作台",
  icons: { icon: "/edgesub-mark.svg", apple: "/edgesub-mark.svg" },
};

export const viewport = {
  themeColor: "#f4f7f7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="edgesub-light">
      <body className="font-sans">
        <ScrollLockStabilizer />
        <div className="min-h-screen bg-gradient-radial flex flex-col">
          <EdgeHeader />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <EdgeFooter />
          <EdgeMobileNav />
        </div>
        <Toaster />
        <ConfirmDialogHost />
      </body>
    </html>
  );
}
