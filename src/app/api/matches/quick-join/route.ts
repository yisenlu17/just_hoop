import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { capacityForType, MATCH_TYPE_LABEL, nextTeam } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const quickJoinSchema = z.object({
  mode: z.enum(["CASUAL", "RANKED"]),
  type: z.enum(["ONE_V_ONE", "THREE_V_THREE"]),
});

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = quickJoinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "赛制无效" }, { status: 400 });
  }

  const { mode, type } = parsed.data;
  const candidates = await prisma.match.findMany({
    where: {
      mode,
      type,
      status: {
        in: ["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE"],
      },
      players: {
        none: {
          userId: user.id,
        },
      },
    },
    include: {
      players: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const target = candidates.find((match) => match.players.length < match.maxPlayers);
  if (!target) {
    const referee = mode === "RANKED" ? await prisma.user.findFirst({ where: { isReferee: true, status: "ACTIVE" } }) : null;
    const match = await prisma.match.create({
      data: {
        code: `JH-${mode === "RANKED" ? "R" : "M"}${Date.now().toString().slice(-5)}`,
        title: `${mode === "RANKED" ? "排位" : "匹配"} ${MATCH_TYPE_LABEL[type]} 快速房`,
        court: "系统推荐球场",
        mode,
        type,
        status: mode === "RANKED" ? "PENDING_PAYMENT" : "OPEN",
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
        maxPlayers: capacityForType(type),
        buyInCents: mode === "RANKED" ? (type === "THREE_V_THREE" ? 1800 : 1200) : 0,
        paymentStatus: mode === "RANKED" ? "PENDING" : "UNPAID",
        refereeId: referee?.id,
        createdById: user.id,
        players: {
          create: {
            userId: user.id,
            team: "A",
            slot: 1,
            paid: mode !== "RANKED",
          },
        },
        events: {
          create: {
            actorId: user.id,
            type: "CREATE",
            note: "快速匹配创建房间",
          },
        },
      },
    });
    return NextResponse.json({ id: match.id });
  }

  const slot = nextTeam(target.players, type);
  if (!slot) {
    return NextResponse.json({ error: "房间已满" }, { status: 409 });
  }

  await prisma.matchPlayer.create({
    data: {
      matchId: target.id,
      userId: user.id,
      team: slot.team,
      slot: slot.slot,
      paid: mode !== "RANKED",
    },
  });
  const nextCount = target.players.length + 1;
  await prisma.match.update({
    where: { id: target.id },
    data: {
      status: nextCount >= target.maxPlayers ? "FULL" : target.status,
      events: {
        create: {
          actorId: user.id,
          type: "JOIN",
          note: "快速匹配加入房间",
        },
      },
    },
  });

  return NextResponse.json({ id: target.id });
}
