import { Radio, ShieldAlert } from "lucide-react";
import { AppShell, ModeMark } from "@/components/AppShell";
import { Avatar, ButtonLink, Panel, Pill, StatusBadge } from "@/components/ui";
import { requireRefereePage } from "@/lib/auth";
import { getMatches } from "@/lib/data";
import { formatLocation, formatTime } from "@/lib/domain";

export default async function RefereePage() {
  const user = await requireRefereePage();
  const refereeTasks = await getMatches({
    status: {
      in: ["OPEN", "FULL", "PENDING_REFEREE", "SCHEDULED", "PRE_CHECK", "LIVE", "PAUSED", "FINISHED"],
    },
    ...(user?.isReferee && !user?.isAdmin ? { OR: [{ refereeId: user.id }, { refereeId: null }] } : {}),
  });

  return (
    <AppShell user={user} active="">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">裁判任务台</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">远程认证、赛前检查、计分和结果确认。</p>
        </div>
        <ButtonLink href="/login" tone="dark">切换账号</ButtonLink>
      </div>
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {refereeTasks.map((match) => (
            <article key={match.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <ModeMark mode={match.mode} type={match.type} />
                    <StatusBadge status={match.status} />
                    {match.livestreamUrl ? <Pill tone="blue"><Radio className="mr-1 h-3 w-3" />直播</Pill> : null}
                  </div>
                  <h2 className="text-xl font-black text-white">{match.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">{formatLocation(match)} · {formatTime(match.scheduledAt)}</p>
                </div>
                <div className="text-right text-3xl font-black text-white">
                  {match.teamAScore}:{match.teamBScore}
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {match.players.slice(0, 6).map((player) => (
                  <span key={player.id} className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-black/24 px-2 py-1">
                    <Avatar label={player.user.avatar} size="sm" />
                    <span className="text-xs font-black text-slate-300">{player.user.name}</span>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                <span className="inline-flex items-center gap-2 text-xs font-black text-slate-500">
                  <ShieldAlert className="h-4 w-4 text-orange-300" />
                  {match.referee?.name ?? "未分配裁判"}
                </span>
                <ButtonLink href={`/referee/matches/${match.id}`} tone="blue">进入控制台</ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
