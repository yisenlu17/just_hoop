import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { rankedGroupIsCompatible, teamPlacementFor } from "@/lib/matchmaking";
import { prisma } from "@/lib/prisma";
import { getPartyContext } from "@/lib/social";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      players: {
        include: {
          user: { include: { ratings: true } },
        },
      },
    },
  });
  if (!match) return NextResponse.json({ error: "房间不存在" }, { status: 404 });
  if (match.players.some((player) => player.userId === user.id)) {
    return NextResponse.json({ ok: true });
  }
  if (!["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE"].includes(match.status)) {
    return NextResponse.json({ error: "当前状态不能加入" }, { status: 409 });
  }

  const { party, size, isLeader, memberIds } = await getPartyContext(user.id);
  const isPartyJoin = size > 1;
  if (isPartyJoin && !isLeader) {
    return NextResponse.json({ error: "组队时由队长带队加入" }, { status: 403 });
  }
  if (isPartyJoin && match.type !== "THREE_V_THREE") {
    return NextResponse.json({ error: "组队仅能加入 3V3 房间" }, { status: 409 });
  }
  if (isPartyJoin && match.players.some((player) => memberIds.includes(player.userId))) {
    return NextResponse.json({ error: "队伍中有人已在该房间" }, { status: 409 });
  }
  if (match.players.length + size > match.maxPlayers) {
    return NextResponse.json({ error: "房间剩余席位不足" }, { status: 409 });
  }

  const orderedIds = isPartyJoin
    ? [user.id, ...memberIds.filter((memberId) => memberId !== user.id)]
    : [user.id];
  const candidates = party ? party.members.map((member) => member.user) : [user];
  if (
    match.mode === "RANKED" &&
    !rankedGroupIsCompatible(
      [...match.players.map((player) => player.user), ...candidates],
      match.type,
    )
  ) {
    return NextResponse.json(
      { error: "该排位房只允许相同或相邻大段位的球员加入" },
      { status: 409 },
    );
  }
  const placement = teamPlacementFor(match.players, match.type, orderedIds.length);
  if (!placement) return NextResponse.json({ error: "没有可容纳整队的位置" }, { status: 409 });

  await prisma.matchPlayer.createMany({
    data: orderedIds.map((memberId, index) => ({
      matchId: match.id,
      userId: memberId,
      team: placement[index].team,
      slot: placement[index].slot,
      paid: match.mode !== "RANKED",
    })),
  });
  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: match.players.length + orderedIds.length >= match.maxPlayers ? "FULL" : match.status,
      events: {
        create: {
          actorId: user.id,
          type: "JOIN",
          note: isPartyJoin ? `组队加入房间（${orderedIds.length} 人）` : "加入房间",
        },
      },
    },
  });
  if (isPartyJoin && party) {
    await prisma.party.update({
      where: { id: party.id },
      data: { matchId: match.id, mode: match.mode },
    });
  }

  return NextResponse.json({ ok: true });
}
