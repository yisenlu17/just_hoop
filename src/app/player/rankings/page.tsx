import { Crown, Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, ButtonLink, Panel, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/data";
import { MATCH_TYPE_LABEL } from "@/lib/domain";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ type }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const mode = type === "THREE_V_THREE" ? "THREE_V_THREE" : "ONE_V_ONE";
  const leaderboard = await getLeaderboard(mode);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <AppShell user={user} active="排行">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">排位排行榜</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">{MATCH_TYPE_LABEL[mode]} 积分、胜负和连胜记录。</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/player/rankings?type=ONE_V_ONE" tone={mode === "ONE_V_ONE" ? "blue" : "dark"}>1V1</ButtonLink>
          <ButtonLink href="/player/rankings?type=THREE_V_THREE" tone={mode === "THREE_V_THREE" ? "blue" : "dark"}>3V3</ButtonLink>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel className="p-4 sm:p-5">
          <div className="grid gap-3">
            {topThree.map((rating, index) => (
              <div
                key={rating.id}
                className="rounded-lg border border-yellow-200/20 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),rgba(255,255,255,0.05))] p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <Pill tone={index === 0 ? "gold" : "blue"}>
                    {index === 0 ? <Crown className="mr-1 h-3 w-3" /> : <Medal className="mr-1 h-3 w-3" />}#{index + 1}
                  </Pill>
                  <div className="text-3xl font-black text-white">{rating.rating}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar label={rating.user.avatar} size="lg" />
                  <div>
                    <div className="text-xl font-black text-white">{rating.user.name}</div>
                    <div className="text-sm font-bold text-slate-500">{rating.user.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-300" />
            <h2 className="text-xl font-black text-white">完整榜单</h2>
          </div>
          <div className="space-y-2">
            {rest.map((rating, index) => (
              <div key={rating.id} className="grid grid-cols-[42px_1fr_auto_auto] items-center gap-3 rounded-lg border border-white/8 bg-black/24 p-3">
                <div className="text-center text-sm font-black text-slate-400">#{index + 4}</div>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar label={rating.user.avatar} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">{rating.user.name}</div>
                    <div className="truncate text-xs font-bold text-slate-500">{rating.user.handle}</div>
                  </div>
                </div>
                <div className="hidden text-sm font-black text-slate-400 sm:block">{rating.wins}W / {rating.losses}L</div>
                <div className="text-right text-sm font-black text-cyan-200">{rating.rating}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
