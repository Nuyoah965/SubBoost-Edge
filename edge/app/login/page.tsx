"use client";

import * as React from "react";
import Image from "next/image";
import { Eye, EyeOff, KeyRound, LoaderCircle, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@subboost/ui/components/ui/button";
import { Input } from "@subboost/ui/components/ui/input";
import { Label } from "@subboost/ui/components/ui/label";

function safeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const nextPath = safeNextPath(searchParams.get("next"));

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me", { cache: "no-store" }).then((response) => {
      if (!cancelled && response.ok) window.location.replace(nextPath);
    });
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "登录失败");
      window.location.replace(nextPath);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-md items-center px-4 py-12 sm:px-6">
      <section className="w-full overflow-hidden rounded-lg border border-[#d7e0de] bg-white shadow-[0_22px_55px_rgba(23,35,33,0.10)]">
        <div className="flex h-1" aria-hidden="true">
          <span className="flex-[3] bg-[#087f70]" />
          <span className="flex-1 bg-[#dc654f]" />
          <span className="flex-1 bg-[#315fcb]" />
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-8 flex items-start gap-4">
            <Image src="/edgesub-mark.svg" alt="EdgeSub" width={44} height={44} priority className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-[#172321]">管理员登录</h1>
              <p className="mt-1 text-sm text-[#60706d]">EdgeSub 管理工作台</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm text-[#475754]">
                管理密码
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71817e]" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  required
                  className="h-11 pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#71817e] transition-colors hover:bg-[#edf3f1] hover:text-[#087f70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f70]/40"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  title={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-[#e4aaa0] bg-[#fff3f0] px-3 py-2.5 text-sm text-[#a33c31]">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full rounded-md" disabled={!password || submitting}>
              {submitting ? <LoaderCircle className="animate-spin" /> : <LogIn />}
              {submitting ? "正在登录" : "登录"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-[calc(100vh-9rem)]" />}>
      <LoginForm />
    </React.Suspense>
  );
}
