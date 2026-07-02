import { Radio, UsersRound } from "lucide-react";
import { ModeMark } from "@/components/AppShell";
import { Avatar, ButtonLink, Pill, StatusBadge } from "@/components/ui";
import { formatLocation, formatMoney, formatTime, SKILL_LEVEL_LABEL, TIME_SLOT_LABEL } from "@/lib/domain";
import type { MatchWithRelations } from "@/lib/data";

export function MatchCard({ match, compact = false }: { match: MatchWithRelations; compact?: boolean }) {
  const players = match.players;
  const playerCount = players.length;
  const teams = {
    A: players.filter((player) => player.team === "A"),
    B: players.filter((player) => player.team === "B"),
  };

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition hover:border-orange-300/35 hover:bg-white/[0.075]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ModeMark mode={match.mode} type={match.type} />
            <StatusBadge status={match.status} />
            {match.livestreamUrl ? <Pill tone="blue"><Radio className="mr-1 h-3 w-3" />直播</Pill> : null}
          </div>
          <h3 className="truncate text-lg font-black text-white">{match.title}</h3>
          <p className="mt-1 text-sm font-bold text-slate-400">
            {formatLocation(match)} · {formatTime(match.scheduledAt)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">
            {match.teamAScore}
            <span className="px-1 text-slate-500">:</span>
            {match.teamBScore}
          </div>
          <div className="text-xs font-black text-slate-400">{match.code}</div>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
        {(["A", "B"] as const).map((team) => (
          <div key={team} className="rounded-lg border border-white/8 bg-black/24 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-400">
              <span>TEAM {team}</span>
              <span>{teams[team].length}</span>
            </div>
            <div className="space-y-2">
              {teams[team].length ? (
                teams[team].map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <Avatar label={player.user.avatar} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-white">{player.user.name}</div>
                      <div className="truncate text-xs font-bold text-slate-500">{player.user.handle}</div>
                    </div>
                    {player.checkedIn ? <span className="ml-auto text-xs font-black text-emerald-300">已签到</span> : null}
                  </div>
                ))
              ) : (
                <div className="text-sm font-bold text-slate-500">等待加入</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-400">
          <span className="inline-flex items-center gap-1">
            <UsersRound className="h-3.5 w-3.5" />
            {playerCount}/{match.maxPlayers}
          </span>
          <span>{formatMoney(match.buyInCents)}</span>
          {match.timeSlot ? <span>{TIME_SLOT_LABEL[match.timeSlot] ?? match.timeSlot}</span> : null}
          {match.skillLevel ? <span>{SKILL_LEVEL_LABEL[match.skillLevel] ?? match.skillLevel}</span> : null}
          {match.ratingMin && match.ratingMax ? <span>{match.ratingMin}-{match.ratingMax}</span> : null}
          <span>{match.mode === "RANKED" ? (match.referee ? `裁判 ${match.referee.name}` : "待远程裁判") : "无需裁判"}</span>
        </div>
        <ButtonLink href={`/player/matches/${match.id}`} tone="ghost" className="min-h-10 px-3 py-2 text-xs">
          进入房间
        </ButtonLink>
      </div>
    </article>
  );
}
