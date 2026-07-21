"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, FileArchive, LogOut, RadioTower } from "lucide-react";

export function EdgeHeader() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[clamp(1200px,95vw,2400px)] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="SubBoost Edge 首页">
          <Image
            src="/logo.png"
            alt="SubBoost"
            width={36}
            height={36}
            priority
            className="rounded-lg shadow-[0_0_22px_rgba(52,211,153,0.16)]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-semibold text-white sm:text-lg">SubBoost Edge</span>
              <span className="hidden rounded border border-emerald-300/25 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-200 sm:inline-flex">
                Worker
              </span>
            </div>
            <span className="hidden text-[11px] text-white/40 sm:block">sub.ccad.cc.cd</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {!isLoginPage && <div className="hidden items-center gap-2 text-xs text-white/50 md:flex" aria-label="边缘服务在线">
            <RadioTower className="h-3.5 w-3.5 text-emerald-300" />
            <span>KV + Cron</span>
          </div>}
          {!isLoginPage && (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center gap-2 rounded border border-white/10 bg-white/5 px-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 sm:px-3"
              title="订阅记录"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">订阅记录</span>
            </Link>
          )}
          <a
            href="/subboost-edge-source.tar.gz"
            download
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            aria-label="下载 SubBoost Edge 对应源代码"
            title="下载对应源代码"
          >
            <FileArchive className="h-4 w-4" />
          </a>
          {!isLoginPage && (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              aria-label="退出登录"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
