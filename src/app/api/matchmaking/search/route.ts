import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import {
  buildMatchmakingWhere,
  matchmakingInclude,
  matchmakingSchema,
  rankedGroupIsCompatible,
  rankedRoomAllowsPlayers,
  serializeMatchForMatchmaking,
  teamPlacementFor,
} from "@/lib/matchmaking";
import { prisma } from "@/lib/prisma";
import { getPartyContext } from "@/lib/social";

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = matchmakingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "筛选条件不完整" }, { status: 400 });
  }

  const { party, size, isLeader, memberIds } = await getPartyContext(user.id);
  if (size > 1 && !isLeader) {
    return NextResponse.json({ error: "组队时由队长发起匹配" }, { status: 403 });
  }
  if (size > 1 && parsed.data.type === "ONE_V_ONE") {
    return NextResponse.json({ error: "组队匹配仅支持 3V3" }, { status: 400 });
  }

  const candidates = party ? party.members.map((member) => member.user) : [user];
  if (
    parsed.data.mode === "RANKED" &&
    !rankedGroupIsCompatible(candidates, parsed.data.type)
  ) {
    return NextResponse.json(
      { error: "队伍成员段位相差超过一个大段，不能一起排位" },
      { status: 409 },
    );
  }

  const matches = await prisma.match.findMany({
    where: buildMatchmakingWhere(parsed.data, memberIds),
    include: matchmakingInclude,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: 20,
  });

  const available = matches
    .filter((match) => teamPlacementFor(match.players, match.type, size))
    .filter(
      (match) =>
        parsed.data.mode !== "RANKED" || rankedRoomAllowsPlayers(match, candidates),
    )
    .map(serializeMatchForMatchmaking);

  return NextResponse.json({ matches: available });
}
