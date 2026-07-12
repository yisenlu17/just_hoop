import { ArrowRight, CalendarClock, Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LobbyActions } from "@/components/LobbyActions";
import { MatchCard } from "@/components/MatchCard";
import { RankBadge } from "@/components/RankBadge";
import { Avatar, ButtonLink, Panel, Pill, StatusBadge } from "@/components/ui";
import { requirePageUser } from "@/lib/auth";
import { getLeaderboard, getMatches } from "@/lib/data";
import { formatTime, MATCH_TYPE_LABEL, rankTitleFromRating } from "@/lib/domain";

export async function PlayerDashboard() {
  const user = await requirePageUser();
  const [matches, leaderboard] = await Promise.all([
    getMatches({
      status: {
        in: ["OPEN", "FULL", "SCHEDULED", "PRE_CHECK", "LIVE"],
      },
    }),
    getLeaderboard("ONE_V_ONE"),
  ]);
  const nextMatch =
    matches.find((match) => match.players.some((player) => player.userId === user?.id)) ?? matches[0];
  const oneVsOne = user?.ratings.find((rating) => rating.mode === "ONE_V_ONE");
  const threeVsThree = user?.ratings.find((rating) => rating.mode === "THREE_V_THREE");
  const bestRating = user?.ratings.length
    ? Math.max(...user.ratings.map((rating) => rating.rating))
    : null;

  return (
    <AppShell user={user} active="大厅" showBack={false}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <section className="grid gap-5">
          <Panel className="overflow-hidden p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  {user ? <Avatar label={user.avatar} size="lg" /> : null}
                  <div>
                    <h1 className="text-3xl font-black tracking-normal text-white sm:text-5xl">
                      {user?.name ?? "球员"}，准备上场
                    </h1>
                    <p className="mt-2 text-sm font-bold text-slate-400 sm:text-base">
                      选择什么时候、在哪里、打什么模式，平台先帮你找球局。
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RankBadge rating={bestRating} title={user?.rankTitle} />
                  <Pill tone="gold">
                    <Trophy className="mr-1 h-3 w-3" />
                    1V1 {oneVsOne?.rating ?? 1000}
                  </Pill>
                  <span className="text-[11px] font-black text-slate-400">
                    {MATCH_TYPE_LABEL.ONE_V_ONE} · {oneVsOne ? rankTitleFromRating(oneVsOne.rating) : "未定级"}
                  </span>
                  <Pill tone="blue">3V3 {threeVsThree?.rating ?? 1000}</Pill>
                  <span className="text-[11px] font-black text-slate-400">
                    {MATCH_TYPE_LABEL.THREE_V_THREE} · {threeVsThree ? rankTitleFromRating(threeVsThree.rating) : "未定级"}
                  </span>
                  <Pill tone="green">
                    <Flame className="mr-1 h-3 w-3" />
                    连胜 {Math.max(oneVsOne?.streak ?? 0, 0)}
                  </Pill>
                </div>
              </div>
              <ButtonLink href="/player/matches/create" tone="ghost" className="shrink-0">
                创建房间
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>

            <div className="mt-6">
              <LobbyActions />
            </div>
          </Panel>

          {nextMatch ? (
            <Panel className="p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">下一场</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    当前最需要处理的房间会放在这里
                  </p>
                </div>
                <StatusBadge status={nextMatch.status} />
              </div>
              <MatchCard match={nextMatch} />
            </Panel>
          ) : null}

        </section>

        <aside className="grid content-start gap-5">
          <Panel className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">排位榜</h2>
              <ButtonLink href="/player/rankings" tone="dark" className="min-h-9 px-3 py-1.5 text-xs">
                查看
              </ButtonLink>
            </div>
            <div className="space-y-3">
              {leaderboard.slice(0, 6).map((rating, index) => (
                <div key={rating.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/24 p-3">
                  <div className="w-6 text-center text-sm font-black text-orange-200">#{index + 1}</div>
                  <Avatar label={rating.user.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-white">{rating.user.name}</div>
                    <div className="mt-0.5">
                      <RankBadge rating={rating.rating} size="sm" showIcon={false} />
                    </div>
                  </div>
                  <div className="text-right text-sm font-black text-cyan-200">{rating.rating}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <h2 className="mb-4 text-lg font-black text-white">今日房间状态</h2>
            <div className="grid gap-3">
              {matches.slice(0, 4).map((match) => (
                <ButtonLink
                  key={match.id}
                  href={`/player/matches/${match.id}`}
                  tone="dark"
                  className="min-h-0 justify-between px-3 py-3"
                >
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-sm">{match.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <CalendarClock className="h-3 w-3" />
                      {formatTime(match.scheduledAt)} · {MATCH_TYPE_LABEL[match.type]}
                    </span>
                  </span>
                  <StatusBadge status={match.status} />
                </ButtonLink>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
