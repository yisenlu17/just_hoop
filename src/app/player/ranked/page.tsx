import { Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MatchCard } from "@/components/MatchCard";
import { ButtonLink, Panel, Pill } from "@/components/ui";
import { requirePageUser } from "@/lib/auth";
import { getMatches } from "@/lib/data";

export default async function RankedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ type }, user] = await Promise.all([searchParams, requirePageUser()]);
  const matchType = type === "THREE_V_THREE" ? "THREE_V_THREE" : "ONE_V_ONE";
  const matches = await getMatches({
    mode: "RANKED",
    type: matchType,
    status: {
      in: ["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE", "SCHEDULED", "PRE_CHECK"],
    },
  });

  return (
    <AppShell user={user} active="大厅">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">推荐排位房间</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">选择赛制后加入同段或相邻段位房间，比赛确认后自动更新段位。</p>
        </div>
        <ButtonLink href="/player/matches/create" tone="orange">开排位房</ButtonLink>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <ButtonLink href="/player/ranked?type=ONE_V_ONE" tone={matchType === "ONE_V_ONE" ? "blue" : "dark"}>1V1</ButtonLink>
        <ButtonLink href="/player/ranked?type=THREE_V_THREE" tone={matchType === "THREE_V_THREE" ? "blue" : "dark"}>3V3</ButtonLink>
        <Pill tone="gold"><Trophy className="mr-1 h-3 w-3" />排位保证金与裁判确认</Pill>
      </div>
      <Panel className="p-4 sm:p-5">
        {matches.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-lg border border-white/10 bg-black/24 text-center">
            <div>
              <div className="text-xl font-black text-white">当前没有可加入房间</div>
              <p className="mt-2 text-sm font-bold text-slate-500">开一个房间，把对手拉上场。</p>
              <ButtonLink href="/player/matches/create" tone="orange" className="mt-4">创建排位</ButtonLink>
            </div>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
