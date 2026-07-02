import { Activity, MapPin, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MatchCard } from "@/components/MatchCard";
import { Avatar, ButtonLink, Panel, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getMatches } from "@/lib/data";
import { MATCH_TYPE_LABEL } from "@/lib/domain";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const matches = user
    ? await getMatches({
        players: {
          some: {
            userId: user.id,
          },
        },
      })
    : [];

  return (
    <AppShell user={user} active="球员卡">
      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Panel className="p-5">
          <div className="flex items-center gap-4">
            {user ? <Avatar label={user.avatar} size="lg" /> : null}
            <div>
              <h1 className="text-3xl font-black text-white">{user?.name ?? "测试球员"}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">{user?.handle}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Pill tone="gold"><Trophy className="mr-1 h-3 w-3" />{user?.rankTitle ?? "青铜"}</Pill>
            <Pill tone="blue"><MapPin className="mr-1 h-3 w-3" />{user?.favoriteCourt ?? "默认球场"}</Pill>
          </div>
          <ButtonLink href={user?.isReferee ? "/referee" : "/player/referee-application"} tone="dark" className="mt-5 w-full">
            {user?.isReferee ? "进入裁判工作台" : "申请成为裁判"}
          </ButtonLink>
          <div className="mt-5 grid gap-3">
            {user?.ratings.map((rating) => (
              <div key={rating.id} className="rounded-lg border border-white/10 bg-black/24 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-300">{MATCH_TYPE_LABEL[rating.mode]}</span>
                  <span className="text-2xl font-black text-white">{rating.rating}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-black text-slate-400">
                  <span>{rating.wins} 胜</span>
                  <span>{rating.losses} 负</span>
                  <span className={rating.streak >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {rating.streak >= 0 ? "+" : ""}{rating.streak}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-black text-white">最近比赛</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {matches.slice(0, 6).map((match) => (
              <MatchCard key={match.id} match={match} compact />
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
