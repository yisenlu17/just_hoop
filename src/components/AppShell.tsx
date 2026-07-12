import Link from "next/link";
import { Gauge, HeartHandshake, ListChecks, Trophy, UserRound } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { CourtBackdrop, Avatar, ButtonLink, Pill } from "@/components/ui";
import { MATCH_TYPE_LABEL, ROLE_LABEL } from "@/lib/domain";

type ShellUser = {
  name: string;
  handle: string;
  avatar: string;
  role: string;
  isReferee?: boolean;
  isAdmin?: boolean;
  ratings?: Array<{ mode: string; rating: number }>;
};

const navItems = [
  { href: "/", label: "大厅", icon: Gauge },
  { href: "/player/matches", label: "比赛", icon: ListChecks },
  { href: "/player/friends", label: "好友", icon: HeartHandshake },
  { href: "/player/rankings", label: "排行", icon: Trophy },
  { href: "/player/profile", label: "球员卡", icon: UserRound },
];

export function AppShell({
  user,
  children,
  active = "大厅",
  showBack = true,
}: {
  user: ShellUser | null;
  children: React.ReactNode;
  active?: string;
  showBack?: boolean;
}) {
  const oneVsOne = user?.ratings?.find((rating) => rating.mode === "ONE_V_ONE");
  const canReferee = Boolean(user?.isReferee || user?.isAdmin);
  const refereeHref = canReferee ? "/referee" : "/player/referee-application";
  const refereeLabel = canReferee ? "裁判入口" : "申请裁判";

  return (
    <div className="min-h-screen text-slate-100">
      <CourtBackdrop />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070d]/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          {showBack ? <BackButton /> : null}
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-orange-300/40 bg-orange-500 text-lg font-black text-black shadow-[0_0_24px_rgba(249,115,22,0.35)]">
              JH
            </span>
            <span className="leading-none">
              <span className="block text-lg font-black tracking-normal text-white">JustHoop</span>
              <span className="block text-xs font-bold text-slate-400">就是打球</span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black transition ${
                    selected
                      ? "bg-white/12 text-white"
                      : "text-slate-400 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href={refereeHref} tone="dark" className="hidden min-h-9 px-3 py-1.5 text-xs sm:inline-flex">
              {refereeLabel}
            </ButtonLink>
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/7 px-2.5 py-2 transition hover:bg-white/12"
            >
              {user ? <Avatar label={user.avatar} size="sm" /> : null}
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-black">{user?.name ?? "测试账号"}</span>
                <span className="block text-xs font-bold text-slate-400">
                  {user ? `${ROLE_LABEL[user.role] ?? user.role} · ${oneVsOne?.rating ?? 1000}` : "选择身份"}
                </span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#05070d]/90 px-2 py-2 backdrop-blur-xl md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black ${
                selected ? "bg-white/12 text-white" : "text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="fixed bottom-20 right-3 z-30 sm:hidden">
        <Link href={refereeHref}>
          <Pill tone="blue">{refereeLabel}</Pill>
        </Link>
      </div>
    </div>
  );
}

export function ModeMark({ mode, type }: { mode: string; type: string }) {
  return (
    <span className="inline-flex overflow-hidden rounded-md border border-white/12 text-[11px] font-black">
      <span className="bg-orange-500 px-2 py-1 text-black">{mode === "RANKED" ? "排位" : "匹配"}</span>
      <span className="bg-white/10 px-2 py-1 text-white">{MATCH_TYPE_LABEL[type]}</span>
    </span>
  );
}
