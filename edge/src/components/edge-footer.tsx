import { Download, ExternalLink } from "lucide-react";

export function EdgeFooter() {
  return (
    <footer className="hidden border-t border-[#d7e0de] bg-white md:block">
      <div className="mx-auto flex w-full max-w-[clamp(1200px,95vw,2400px)] items-center justify-between gap-6 px-6 py-5 text-xs text-[#60706d] lg:px-8 xl:px-12">
        <p>EdgeSub · 基于 SubBoost 2.6.0 · AGPL-3.0-only</p>
        <div className="flex items-center gap-5">
          <a
            href="/subboost-edge-source.tar.gz"
            download
            className="inline-flex items-center gap-1.5 text-[#60706d] transition-colors hover:text-[#087f70]"
          >
            对应源代码
            <Download className="h-3 w-3" />
          </a>
          <a
            href="https://github.com/SubBoost/subboost"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#60706d] transition-colors hover:text-[#087f70]"
          >
            上游项目
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
