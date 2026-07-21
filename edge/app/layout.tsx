import type { Metadata } from "next";
import "@subboost/ui/styles/globals.css";
import { ConfirmDialogHost } from "@subboost/ui/components/ui/confirm-dialog";
import { ScrollLockStabilizer } from "@subboost/ui/components/layout/scroll-lock-stabilizer";
import { Toaster } from "@subboost/ui/components/ui/toaster";
import { EdgeFooter } from "@edge/components/edge-footer";
import { EdgeHeader } from "@edge/components/edge-header";
import { EdgeMobileNav } from "@edge/components/edge-mobile-nav";

export const metadata: Metadata = {
  title: "SubBoost Edge",
  description: "Clash and Mihomo subscription workspace on Cloudflare Edge",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
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
