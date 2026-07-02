"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Banknote,
  ClipboardCheck,
  FileWarning,
  Gauge,
  ListChecks,
  Menu,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui";

const navigation = [
  { href: "/admin", label: "总览", icon: Gauge },
  { href: "/admin/users", label: "用户管理", icon: UsersRound },
  { href: "/admin/referee-applications", label: "裁判审批", icon: ClipboardCheck },
  { href: "/admin/matches", label: "比赛管理", icon: ListChecks },
  { href: "/admin/disputes", label: "申诉管理", icon: FileWarning },
  { href: "/admin/payments", label: "支付管理", icon: Banknote },
  { href: "/admin/logs", label: "管理日志", icon: Activity },
];

type AdminUser = {
  name: string;
  handle: string;
  avatar: string;
};

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <>
      <div className="flex h-17 items-center border-b border-white/8 px-5">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-sm font-black text-[#17130f]">
            JH
          </span>
          <span>
            <span className="block text-base font-black tracking-tight text-white">就是打球</span>
            <span className="block text-[11px] font-bold tracking-[0.18em] text-slate-500">管理中心</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition",
                selected
                  ? "bg-orange-500/12 text-orange-200"
                  : "text-slate-400 hover:bg-white/6 hover:text-slate-100",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  selected ? "text-orange-400" : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              {item.label}
              {selected ? <span className="ml-auto h-5 w-0.5 rounded-full bg-orange-400" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-3">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-white/6"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-orange-400/30 bg-orange-400/10 text-xs font-black text-orange-200">
            {user.avatar}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-100">{user.name}</span>
            <span className="block truncate text-xs text-slate-500">@{user.handle}</span>
          </span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-white/8 bg-[#0b0f16] lg:flex">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="关闭导航"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col border-r border-white/10 bg-[#0b0f16] shadow-2xl">
            <button
              aria-label="关闭导航"
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/8"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[228px]">
        <header className="sticky top-0 z-30 flex h-17 items-center gap-3 border-b border-white/8 bg-[#080b11]/94 px-4 backdrop-blur-xl sm:px-6">
          <button
            aria-label="打开导航"
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-300 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            管理员权限已验证
          </div>
          <div className="ml-auto">
            <Link
              href="/"
              className="inline-flex min-h-9 items-center rounded-lg border border-white/10 px-3 text-xs font-bold text-slate-300 transition hover:border-white/20 hover:bg-white/6"
            >
              返回用户端
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
