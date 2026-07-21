"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Download, Eye, Settings2 } from "lucide-react";

const items = [
  { id: "config", label: "配置", icon: Settings2 },
  { id: "preview", label: "预览", icon: Eye },
] as const;

export function EdgeMobileNav() {
  const pathname = usePathname();
  const [active, setActive] = React.useState("config");

  const goTo = (id: string) => {
    if (pathname !== "/") {
      window.location.assign(`/#${id}`);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${id}`);
    setActive(id);
  };

  if (pathname === "/login") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 h-16 border-t border-white/10 bg-black/85 backdrop-blur-xl md:hidden" aria-label="工作台导航">
      <div className="grid h-full grid-cols-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(item.id)}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs transition-colors ${
              active === item.id ? "text-emerald-300" : "text-white/45"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
        <Link
          href="/dashboard"
          className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs transition-colors ${
            pathname === "/dashboard" ? "text-emerald-300" : "text-white/45"
          }`}
        >
          <Database className="h-5 w-5" />
          <span>记录</span>
        </Link>
        <a
          href="/subboost-edge-source.tar.gz"
          download
          className="flex min-w-0 flex-col items-center justify-center gap-1 text-xs text-white/45 transition-colors hover:text-white"
        >
          <Download className="h-5 w-5" />
          <span>源码</span>
        </a>
      </div>
    </nav>
  );
}
