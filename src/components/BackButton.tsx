"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/", className }: { fallback?: string; className?: string }) {
  const router = useRouter();

  const goBack = () => {
    // 有浏览历史就返回上一页，否则回落到兜底路径（默认首页）。
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="返回上一页"
      className={
        className ??
        "inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/7 px-2.5 py-1.5 text-xs font-black text-slate-200 transition hover:border-white/25 hover:bg-white/12"
      }
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline">返回</span>
    </button>
  );
}
