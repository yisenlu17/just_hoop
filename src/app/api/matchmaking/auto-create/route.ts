import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import {
  autoCreateCourt,
  autoCreateScheduledAt,
  autoCreateTitle,
  matchmakingSchema,
  normalizeMatchmakingInput,
  rankedGroupIsCompatible,
  rankedRatingWindow,
  targetPlayersFor,
} from "@/lib/matchmaking";
import { prisma } from "@/lib/prisma";
import { getPartyContext } from "@/lib/social";

function codeFor(mode: "CASUAL" | "RANKED") {
  return `JH-${mode === "RANKED" ? "R" : "M"}${Date.now().toString().slice(-5)}`;
}

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

  const input = normalizeMatchmakingInput(parsed.data);
  const candidates = party ? party.members.map((member) => member.user) : [user];
  if (input.mode === "RANKED" && !rankedGroupIsCompatible(candidates, input.type)) {
    return NextResponse.json(
      { error: "队伍成员段位相差超过一个大段，不能一起排位" },
      { status: 409 },
    );
  }
  const scheduledAt = autoCreateScheduledAt(input);
  if (scheduledAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "所选时段已经结束，请选择之后的时段或日期" }, { status: 400 });
  }
  const rankWindow = input.mode === "RANKED" ? rankedRatingWindow(candidates, input.type) : null;
  const referee = input.mode === "RANKED" ? await prisma.user.findFirst({ where: { isReferee: true, status: "ACTIVE" } }) : null;
  // 队长排第一位，整队占据 A 队席位。
  const orderedIds = [user.id, ...memberIds.filter((id) => id !== user.id)];
  const match = await prisma.match.create({
    data: {
      code: codeFor(input.mode),
      title: autoCreateTitle(input),
      mode: input.mode,
      type: input.type,
      status: "OPEN",
      court: autoCreateCourt(input),
      city: input.city === "ALL" ? null : input.city,
      district: input.district === "ALL" ? null : input.district,
      gym: input.gym === "ALL" ? null : input.gym,
      timeSlot: input.timeSlot,
      skillLevel: input.skillLevel,
      ratingMin: rankWindow?.min,
      ratingMax: rankWindow?.max,
      scheduledAt,
      maxPlayers: targetPlayersFor(input),
      buyInCents: input.mode === "RANKED" ? (input.type === "THREE_V_THREE" ? 1800 : 1200) : 0,
      paymentStatus: input.mode === "RANKED" ? "PENDING" : "UNPAID",
      refereeId: referee?.id,
      createdById: user.id,
      players: {
        create: orderedIds.map((memberId, index) => ({
          userId: memberId,
          team: "A",
          slot: index + 1,
          paid: input.mode !== "RANKED",
        })),
      },
      events: {
        create: {
          actorId: user.id,
          type: "CREATE",
          note: size > 1 ? `按筛选条件自动创建等待房间（${size} 人组队）` : "按筛选条件自动创建等待房间",
          payload: JSON.parse(JSON.stringify(input)),
        },
      },
    },
  });

  if (party) {
    await prisma.party.update({
      where: { id: party.id },
      data: { matchId: match.id, mode: input.mode },
    });
  }

  return NextResponse.json({ id: match.id });
}
