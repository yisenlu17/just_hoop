import { notFound } from "next/navigation";
import { ExternalLink, Radio } from "lucide-react";
import { AppShell, ModeMark } from "@/components/AppShell";
import { RefereeConsole } from "@/components/RefereeConsole";
import { Avatar, ButtonLink, Panel, Pill, StatusBadge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getMatch } from "@/lib/data";
import { EVENT_LABEL, formatLocation, formatTime } from "@/lib/domain";

export default async function RefereeMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  const match = await getMatch(id);
  if (!match) notFound();

  return (
    <AppShell user={user} active="">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <ModeMark mode={match.mode} type={match.type} />
            <StatusBadge status={match.status} />
          </div>
          <h1 className="text-3xl font-black text-white">{match.title}</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">{formatLocation(match)} · {formatTime(match.scheduledAt)}</p>
        </div>
        <ButtonLink href={`/player/matches/${match.id}`} tone="dark">查看球员房间</ButtonLink>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">直播与赛前</h2>
            <Pill tone={match.livestreamUrl ? "green" : "orange"}>{match.livestreamUrl ? "已接入" : "待链接"}</Pill>
          </div>
          <div className="grid aspect-video place-items-center rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),rgba(0,0,0,0.52))]">
            <div className="text-center">
              <Radio className="mx-auto mb-3 h-9 w-9 text-cyan-300" />
              <div className="text-sm font-black text-white">远程直播画面</div>
              {match.livestreamUrl ? (
                <a href={match.livestreamUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-cyan-200">
                  打开链接 <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <div className="mt-2 text-xs font-bold text-slate-500">等待球员上传</div>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {match.players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/24 p-3">
                <Avatar label={player.user.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-white">{player.user.name}</div>
                  <div className="truncate text-xs font-bold text-slate-500">TEAM {player.team}</div>
                </div>
                {player.checkedIn ? <Pill tone="green">签到</Pill> : <Pill tone="orange">待签</Pill>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-5 grid place-items-center rounded-lg border border-orange-300/18 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.16),rgba(0,0,0,0.28))] p-5">
            <div className="text-center">
              <div className="text-xs font-black text-slate-500">SCORE</div>
              <div className="text-7xl font-black text-white">
                {match.teamAScore}
                <span className="px-3 text-slate-600">:</span>
                {match.teamBScore}
              </div>
              <div className="mt-1 text-xs font-black text-orange-200">TEAM A / TEAM B</div>
            </div>
          </div>
          <RefereeConsole matchId={match.id} status={match.status} />
        </Panel>

        <Panel className="p-4">
          <h2 className="mb-4 text-lg font-black text-white">事件日志</h2>
          <div className="space-y-2">
            {match.events.map((event) => (
              <div key={event.id} className="rounded-lg border border-white/8 bg-black/24 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-cyan-200">{EVENT_LABEL[event.type] ?? event.type}</span>
                  <span className="text-xs font-bold text-slate-500">{formatTime(event.createdAt)}</span>
                </div>
                <div className="mt-1 text-sm font-bold text-slate-300">{event.note ?? "已记录"}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
