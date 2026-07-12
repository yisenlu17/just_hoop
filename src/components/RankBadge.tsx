import { Shield } from "lucide-react";
import { clsx } from "clsx";
import {
  RANK_BAR,
  RANK_TONE,
  rankFromRating,
  rankKeyFromTitle,
  rankProgress,
  type RankTierKey,
} from "@/lib/domain";

const NEUTRAL_TONE = "border-white/15 bg-white/8 text-slate-300";

type RankBadgeProps = {
  rating?: number | null;
  title?: string | null;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/**
 * 段位徽章：优先按 rating 派生小段（青铜 III ~ 王者），
 * 没有 rating 时退回展示 title 文本并按大段着色。
 */
export function RankBadge({ rating, title, showIcon = true, size = "md", className }: RankBadgeProps) {
  const hasRating = typeof rating === "number";
  const division = hasRating ? rankFromRating(rating as number) : null;
  const label = division?.label ?? title ?? "未定级";
  const key: RankTierKey | null = division?.key ?? rankKeyFromTitle(title);
  const tone = key ? RANK_TONE[key] : NEUTRAL_TONE;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border font-black shadow-lg",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        tone,
        className,
      )}
    >
      {showIcon ? <Shield className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} /> : null}
      {label}
    </span>
  );
}

/**
 * 升段进度条：显示当前小段、距下一小段还差多少分。
 */
export function RankProgress({ rating, className }: { rating: number; className?: string }) {
  const { current, next, pct, toNext } = rankProgress(rating);
  const bar = RANK_BAR[current.key];

  return (
    <div className={clsx("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-[11px] font-black text-slate-400">
        <span>{current.label}</span>
        <span>{next ? `距 ${next.label} 还差 ${toNext} 分` : "已达最高段位 · 王者"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/40">
        <div
          className={clsx("h-full rounded-full transition-all", bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
