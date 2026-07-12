import { AppShell } from "@/components/AppShell";
import { MatchCard } from "@/components/MatchCard";
import { ButtonLink, Panel } from "@/components/ui";
import { requirePageUser } from "@/lib/auth";
import { getMatches } from "@/lib/data";
import { MATCH_MODE_LABEL, MATCH_TYPE_LABEL } from "@/lib/domain";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; type?: string }>;
}) {
  const [{ mode, type }, user] = await Promise.all([searchParams, requirePageUser()]);
  const matches = await getMatches({
    ...(mode === "RANKED" || mode === "CASUAL" ? { mode } : {}),
    ...(type === "ONE_V_ONE" || type === "THREE_V_THREE" ? { type } : {}),
  });

  return (
    <AppShell user={user} active="比赛">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">比赛房间</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">招募、排期、直播和已结束比赛都在这里。</p>
        </div>
        <ButtonLink href="/player/matches/create" tone="orange">创建房间</ButtonLink>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <ButtonLink href="/player/matches" tone={!mode && !type ? "blue" : "dark"}>全部</ButtonLink>
        {Object.entries(MATCH_MODE_LABEL).map(([value, label]) => (
          <ButtonLink key={value} href={`/player/matches?mode=${value}`} tone={mode === value ? "blue" : "dark"}>
            {label}
          </ButtonLink>
        ))}
        {Object.entries(MATCH_TYPE_LABEL).map(([value, label]) => (
          <ButtonLink key={value} href={`/player/matches?type=${value}`} tone={type === value ? "blue" : "dark"}>
            {label}
          </ButtonLink>
        ))}
      </div>
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
