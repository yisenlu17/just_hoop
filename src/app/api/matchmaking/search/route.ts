import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import {
  buildMatchmakingWhere,
  matchmakingInclude,
  matchmakingSchema,
  ratingOverlaps,
  serializeMatchForMatchmaking,
} from "@/lib/matchmaking";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = matchmakingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "筛选条件不完整" }, { status: 400 });
  }

  const matches = await prisma.match.findMany({
    where: buildMatchmakingWhere(parsed.data, user.id),
    include: matchmakingInclude,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: 20,
  });

  const available = matches
    .filter((match) => match.players.length < match.maxPlayers)
    .filter((match) => ratingOverlaps(match, parsed.data))
    .map(serializeMatchForMatchmaking);

  return NextResponse.json({ matches: available });
}
