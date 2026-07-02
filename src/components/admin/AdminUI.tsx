import type { ReactNode } from "react";
import { cn } from "@/components/ui";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-white/8 bg-[#0d121b] shadow-[0_20px_60px_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  detail,
  icon,
  tone = "orange",
}: {
  label: string;
  value: number | string;
  detail?: string;
  icon: ReactNode;
  tone?: "orange" | "cyan" | "green" | "red" | "violet";
}) {
  const tones = {
    orange: "border-orange-400/20 bg-orange-400/8 text-orange-300",
    cyan: "border-cyan-400/20 bg-cyan-400/8 text-cyan-300",
    green: "border-emerald-400/20 bg-emerald-400/8 text-emerald-300",
    red: "border-red-400/20 bg-red-400/8 text-red-300",
    violet: "border-violet-400/20 bg-violet-400/8 text-violet-300",
  };
  return (
    <AdminPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-white">{value}</div>
          {detail ? <div className="mt-1 text-xs text-slate-600">{detail}</div> : null}
        </div>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg border", tones[tone])}>
          {icon}
        </span>
      </div>
    </AdminPanel>
  );
}

const badgeTones = {
  gray: "border-white/10 bg-white/6 text-slate-300",
  orange: "border-orange-400/25 bg-orange-400/9 text-orange-200",
  green: "border-emerald-400/25 bg-emerald-400/9 text-emerald-200",
  red: "border-red-400/25 bg-red-400/9 text-red-200",
  cyan: "border-cyan-400/25 bg-cyan-400/9 text-cyan-200",
  violet: "border-violet-400/25 bg-violet-400/9 text-violet-200",
};

export function AdminBadge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-white/8 bg-white/[0.018] text-[11px] font-bold uppercase tracking-wide text-slate-500">
      <tr>{children}</tr>
    </thead>
  );
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center px-6 py-12 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-200">{children || "—"}</div>
    </div>
  );
}
