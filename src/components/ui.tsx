import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { STATUS_META, toneClasses } from "@/lib/domain";

type ButtonTone = "orange" | "blue" | "ghost" | "danger" | "dark";

const buttonTone: Record<ButtonTone, string> = {
  orange:
    "border-orange-300/60 bg-orange-500 text-black shadow-[0_0_24px_rgba(249,115,22,0.28)] hover:bg-orange-400",
  blue:
    "border-cyan-300/50 bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.24)] hover:bg-cyan-300",
  ghost:
    "border-white/12 bg-white/7 text-slate-100 hover:border-white/25 hover:bg-white/12",
  danger:
    "border-red-300/50 bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.24)] hover:bg-red-400",
  dark: "border-white/10 bg-black/35 text-slate-100 hover:border-white/25 hover:bg-white/10",
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function Button({
  className,
  tone = "ghost",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-orange-300/60 disabled:cursor-not-allowed disabled:opacity-45",
        buttonTone[tone],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  tone = "ghost",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  tone?: ButtonTone;
}) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-orange-300/60",
        buttonTone[tone],
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "gray" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-black shadow-lg",
        toneClasses(meta.tone),
      )}
    >
      {meta.label}
    </span>
  );
}

export function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "orange" | "red" | "gold" | "gray";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-black",
        toneClasses(tone),
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ label, size = "md" }: { label: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg border border-orange-300/35 bg-[radial-gradient(circle_at_30%_20%,#ffd38a,#f97316_45%,#6b220b)] font-black text-black shadow-[0_0_22px_rgba(249,115,22,0.2)]",
        sizeClass,
      )}
    >
      {label}
    </span>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-white/10 bg-slate-950/62 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CourtBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05070d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_18%_18%,rgba(249,115,22,0.2),transparent_32%),linear-gradient(180deg,rgba(3,7,18,0.36),#05070d_72%)]" />
      <div className="absolute left-1/2 top-[12%] h-[70vw] max-h-[760px] w-[104vw] max-w-[1180px] -translate-x-1/2 rounded-[50%] border border-orange-300/12 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_56%)]" />
      <div className="absolute bottom-[-15%] left-1/2 h-[54vw] max-h-[560px] w-[88vw] max-w-[980px] -translate-x-1/2 rounded-t-full border border-cyan-300/10 bg-[linear-gradient(90deg,transparent_49.8%,rgba(34,211,238,0.18)_50%,transparent_50.2%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_1px)] bg-[length:100%_100%,100%_42px]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#05070d] to-transparent" />
    </div>
  );
}
