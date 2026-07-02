import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireReferee } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settleRankedMatch } from "@/lib/rating";

const eventSchema = z.object({
  action: z.enum([
    "PRE_CHECK",
    "START",
    "SCORE",
    "FOUL",
    "UNDO",
    "PAUSE",
    "RESUME",
    "END",
    "CONFIRM",
    "INVALID",
  ]),
  team: z.enum(["A", "B"]).optional(),
  points: z.number().int().min(1).max(3).optional(),
  note: z.string().max(160).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireReferee()]);
  if (!user) return NextResponse.json({ error: "没有裁判权限" }, { status: 403 });

  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "裁判动作无效" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });
  if (!match) return NextResponse.json({ error: "比赛不存在" }, { status: 404 });
  if (!user.isAdmin && match.refereeId && match.refereeId !== user.id) {
    return NextResponse.json({ error: "该比赛已分配给其他裁判" }, { status: 403 });
  }

  const { action, team, points, note } = parsed.data;
  const eventNote = note ?? action;

  if (action === "PRE_CHECK") {
    await prisma.match.update({
      where: { id },
      data: {
        status: "PRE_CHECK",
        refereeId: user.id,
        events: {
          create: { actorId: user.id, type: "PRE_CHECK", note: eventNote },
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "START") {
    await prisma.match.update({
      where: { id },
      data: {
        status: "LIVE",
        refereeId: user.id,
        events: {
          create: { actorId: user.id, type: "START", note: eventNote },
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "SCORE") {
    if (!team || !points) {
      return NextResponse.json({ error: "缺少队伍或分值" }, { status: 400 });
    }
    if (match.status !== "LIVE") {
      return NextResponse.json({ error: "只有进行中的比赛可以计分" }, { status: 409 });
    }
    await prisma.match.update({
      where: { id },
      data: {
        teamAScore: team === "A" ? { increment: points } : undefined,
        teamBScore: team === "B" ? { increment: points } : undefined,
        events: {
          create: { actorId: user.id, type: "SCORE", team, points, note: eventNote },
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "FOUL") {
    await prisma.match.update({
      where: { id },
      data: {
        events: {
          create: { actorId: user.id, type: "FOUL", team, note: eventNote },
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "UNDO") {
    const scoreEvent = match.events.find((event) => event.type === "SCORE" && event.team && event.points);
    if (!scoreEvent) {
      return NextResponse.json({ error: "没有可撤回的计分" }, { status: 409 });
    }
    await prisma.match.update({
      where: { id },
      data: {
        teamAScore:
          scoreEvent.team === "A"
            ? { decrement: Math.min(scoreEvent.points ?? 0, match.teamAScore) }
            : undefined,
        teamBScore:
          scoreEvent.team === "B"
            ? { decrement: Math.min(scoreEvent.points ?? 0, match.teamBScore) }
            : undefined,
        events: {
          create: {
            actorId: user.id,
            type: "UNDO",
            team: scoreEvent.team,
            points: scoreEvent.points,
            note: "撤回上一条计分",
          },
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "PAUSE") {
    await prisma.match.update({
      where: { id },
      data: {
        status: "PAUSED",
        events: { create: { actorId: user.id, type: "PAUSE", note: eventNote } },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "RESUME") {
    await prisma.match.update({
      where: { id },
      data: {
        status: "LIVE",
        events: { create: { actorId: user.id, type: "RESUME", note: eventNote } },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "END") {
    const winnerTeam =
      match.teamAScore > match.teamBScore ? "A" : match.teamBScore > match.teamAScore ? "B" : null;
    await prisma.match.update({
      where: { id },
      data: {
        status: "FINISHED",
        winnerTeam,
        events: { create: { actorId: user.id, type: "END", note: eventNote } },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "CONFIRM") {
    if (match.mode === "RANKED" && match.winnerTeam) {
      await settleRankedMatch(prisma, id);
    } else {
      await prisma.match.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });
    }
    await prisma.refereeEvent.create({
      data: { matchId: id, actorId: user.id, type: "CONFIRM", note: eventNote },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "INVALID") {
    await prisma.match.update({
      where: { id },
      data: {
        status: "INVALID",
        events: { create: { actorId: user.id, type: "INVALID", note: eventNote } },
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "未知动作" }, { status: 400 });
}
