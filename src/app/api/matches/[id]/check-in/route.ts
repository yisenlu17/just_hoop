import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);
  const player = await prisma.matchPlayer.findUnique({
    where: {
      matchId_userId: {
        matchId: id,
        userId: user.id,
      },
    },
  });
  if (!player) {
    return NextResponse.json({ error: "你还不在这个房间" }, { status: 404 });
  }

  await prisma.matchPlayer.update({
    where: { id: player.id },
    data: { checkedIn: true },
  });
  await prisma.match.update({
    where: { id },
    data: {
      events: {
        create: {
          actorId: user.id,
          type: "CHECK_IN",
          note: "球员签到",
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
