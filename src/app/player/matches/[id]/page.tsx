import { notFound } from "next/navigation";
import { ExternalLink, Radio, ShieldCheck } from "lucide-react";
import { AppShell, ModeMark } from "@/components/AppShell";
import { MatchRoomActions } from "@/components/MatchRoomActions";
import { Avatar, ButtonLink, Panel, Pill, StatusBadge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getMatch } from "@/lib/data";
import { EVENT_LABEL, formatLocation, formatMoney, formatTime, MATCH_TYPE_LABEL } from "@/lib/domain";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  const match = await getMatch(id);
  if (!match) notFound();

  const canJoin =
    match.players.length < match.maxPlayers &&
    ["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE"].includes(match.status) &&
    !match.players.some((player) => player.userId === user?.id);
  const teams = {
    A: match.players.filter((player) => player.team === "A"),
    B: match.players.filter((player) => player.team === "B"),
  };

  return (
    <AppShell user={user} active="比赛">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <ModeMark mode={match.mode} type={match.type} />
            <StatusBadge status={match.status} />
            <Pill tone="blue">{match.code}</Pill>
          </div>
          <h1 className="text-3xl font-black text-white">{match.title}</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {formatLocation(match)} · {formatTime(match.scheduledAt)} · {formatMoney(match.buyInCents)}
          </p>
        </div>
        <ButtonLink href={`/referee/matches/${match.id}`} tone="dark">
          <ShieldCheck className="h-4 w-4" />
          裁判台
        </ButtonLink>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-5">
          <Panel className="p-4 sm:p-5">
            <div className="grid items-stretch gap-4 md:grid-cols-[1fr_180px_1fr]">
              {(["A", "B"] as const).map((team) => (
                <div key={team} className="rounded-lg border border-white/10 bg-black/24 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-black text-white">TEAM {team}</h2>
                    {match.winnerTeam === team ? <Pill tone="gold">胜方</Pill> : null}
                  </div>
                  <div className="space-y-3">
                    {teams[team].map((player) => (
                      <div key={player.id} className="flex items-center gap-3 rounded-lg bg-white/[0.04] p-3">
                        <Avatar label={player.user.avatar} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-black text-white">{player.user.name}</div>
                          <div className="truncate text-xs font-bold text-slate-500">{player.user.handle}</div>
                        </div>
                        {player.checkedIn ? <Pill tone="green">签到</Pill> : <Pill>待签</Pill>}
                      </div>
                    ))}
                    {!teams[team].length ? (
                      <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm font-bold text-slate-500">
                        空位
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              <div className="order-first grid place-items-center rounded-lg border border-orange-300/18 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.16),rgba(0,0,0,0.28))] p-5 md:order-none">
                <div className="text-center">
                  <div className="text-xs font-black text-slate-500">{MATCH_TYPE_LABEL[match.type]}</div>
                  <div className="my-2 text-5xl font-black text-white">
                    {match.teamAScore}
                    <span className="px-2 text-slate-600">:</span>
                    {match.teamBScore}
                  </div>
                  <div className="text-xs font-black text-orange-200">LIVE SCORE</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">比赛动态</h2>
              {match.livestreamUrl ? (
                <a
                  href={match.livestreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100"
                >
                  <Radio className="h-4 w-4" />
                  直播
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Pill tone="gray">待上传直播</Pill>
              )}
            </div>
            <div className="space-y-2">
              {match.events.map((event) => (
                <div key={event.id} className="grid gap-1 rounded-lg border border-white/8 bg-black/24 p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center">
                  <div className="text-xs font-black text-cyan-200">{EVENT_LABEL[event.type] ?? event.type}</div>
                  <div className="text-sm font-bold text-slate-300">{event.note ?? "已记录"}</div>
                  <div className="text-xs font-bold text-slate-500">{formatTime(event.createdAt)}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <aside className="grid content-start gap-5">
          <Panel className="p-4">
            <h2 className="mb-4 text-lg font-black text-white">房间操作</h2>
            <MatchRoomActions matchId={match.id} canJoin={canJoin} livestreamUrl={match.livestreamUrl} />
          </Panel>
          <Panel className="p-4">
            <h2 className="mb-4 text-lg font-black text-white">裁判与争议</h2>
            <div className="grid gap-3 text-sm font-bold text-slate-400">
              <div className="flex justify-between gap-3">
                <span>裁判</span>
                <span className="text-white">{match.referee?.name ?? "待分配"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>支付</span>
                <span className="text-white">{match.paymentStatus}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>争议</span>
                <span className={match.disputes.length ? "text-red-200" : "text-emerald-200"}>
                  {match.disputes.length ? `${match.disputes.length} 条` : "无"}
                </span>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
