import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { nextTeam } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);
  const match = await prisma.match.findUnique({
    where: { id },
    include: { players: true },
  });
  if (!match) return NextResponse.json({ error: "房间不存在" }, { status: 404 });
  if (match.players.some((player) => player.userId === user.id)) {
    return NextResponse.json({ ok: true });
  }
  if (!["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE"].includes(match.status)) {
    return NextResponse.json({ error: "当前状态不能加入" }, { status: 409 });
  }
  if (match.players.length >= match.maxPlayers) {
    return NextResponse.json({ error: "房间已满" }, { status: 409 });
  }

  const slot = nextTeam(match.players, match.type);
  if (!slot) return NextResponse.json({ error: "没有可用位置" }, { status: 409 });

  await prisma.matchPlayer.create({
    data: {
      matchId: match.id,
      userId: user.id,
      team: slot.team,
      slot: slot.slot,
      paid: match.mode !== "RANKED",
    },
  });
  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: match.players.length + 1 >= match.maxPlayers ? "FULL" : match.status,
      events: {
        create: {
          actorId: user.id,
          type: "JOIN",
          note: "加入房间",
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
