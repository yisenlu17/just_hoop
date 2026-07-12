import { AppShell } from "@/components/AppShell";
import { MatchmakingFlow } from "@/components/MatchmakingFlow";
import { requirePageUser } from "@/lib/auth";
import { getMatches } from "@/lib/data";
import { rankedRoomAllowsPlayers, serializeMatchForMatchmaking } from "@/lib/matchmaking";
import { serializePlayer } from "@/lib/social";
import { getPartyContext } from "@/lib/social";

const JOINABLE = ["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE"] as const;

export default async function MatchmakingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ mode }, user] = await Promise.all([searchParams, requirePageUser()]);
  const initialMode = mode === "RANKED" ? "RANKED" : "CASUAL";

  // 按模式各取一份推荐房间（未加入、可加入状态）。
  const [casual, ranked, partyContext] = await Promise.all([
    getMatches({
      mode: "CASUAL",
      status: { in: [...JOINABLE] },
      players: { none: { userId: user.id } },
    }),
    getMatches({
      mode: "RANKED",
      status: { in: [...JOINABLE] },
      players: { none: { userId: user.id } },
    }),
    getPartyContext(user.id),
  ]);

  const rankedCandidates = partyContext.party
    ? partyContext.party.members.map((member) => member.user)
    : [user];

  const recommended = {
    CASUAL: casual
      .filter((match) => match.players.length < match.maxPlayers)
      .slice(0, 4)
      .map(serializeMatchForMatchmaking),
    RANKED: ranked
      .filter((match) => match.players.length < match.maxPlayers)
      .filter((match) => rankedRoomAllowsPlayers(match, rankedCandidates))
      .slice(0, 4)
      .map(serializeMatchForMatchmaking),
  };

  return (
    <AppShell user={user} active="大厅">
      <MatchmakingFlow
        initialMode={initialMode}
        viewer={serializePlayer(user)}
        recommended={recommended}
      />
    </AppShell>
  );
}
