import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import {
  capacityForType,
  parseShanghaiLocalDateTime,
  timeSlotFromDate,
} from "@/lib/domain";
import { rankedRatingWindow } from "@/lib/matchmaking";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(2).max(40),
  court: z.string().min(2).max(60),
  mode: z.enum(["CASUAL", "RANKED"]),
  type: z.enum(["ONE_V_ONE", "THREE_V_THREE"]),
  scheduledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  livestreamUrl: z.string().optional(),
});

function codeFor(mode: "CASUAL" | "RANKED") {
  return `JH-${mode === "RANKED" ? "R" : "M"}${Date.now().toString().slice(-5)}`;
}

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "房间信息不完整" }, { status: 400 });
  }

  const input = parsed.data;
  const scheduledAt = parseShanghaiLocalDateTime(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "请填写晚于当前时间的具体开赛时间" }, { status: 400 });
  }
  const timeSlot = timeSlotFromDate(scheduledAt);
  if (!timeSlot) {
    return NextResponse.json(
      { error: "开赛时间须在上午、下午、晚间或夜场的规定时段内" },
      { status: 400 },
    );
  }
  const rankWindow = input.mode === "RANKED" ? rankedRatingWindow([user], input.type) : null;
  const referee = input.mode === "RANKED" ? await prisma.user.findFirst({ where: { isReferee: true, status: "ACTIVE" } }) : null;
  const match = await prisma.match.create({
    data: {
      code: codeFor(input.mode),
      title: input.title,
      court: input.court,
      mode: input.mode,
      type: input.type,
      status: input.mode === "RANKED" ? "PENDING_PAYMENT" : "OPEN",
      timeSlot,
      ratingMin: rankWindow?.min,
      ratingMax: rankWindow?.max,
      scheduledAt,
      livestreamUrl: input.livestreamUrl || null,
      maxPlayers: capacityForType(input.type),
      buyInCents: input.mode === "RANKED" ? (input.type === "THREE_V_THREE" ? 1800 : 1200) : 0,
      paymentStatus: input.mode === "RANKED" ? "PENDING" : "UNPAID",
      refereeId: referee?.id,
      createdById: user.id,
      players: {
        create: {
          userId: user.id,
          team: "A",
          slot: 1,
          paid: input.mode !== "RANKED",
        },
      },
      events: {
        create: {
          actorId: user.id,
          type: "CREATE",
          note: "房间创建成功",
        },
      },
    },
  });

  return NextResponse.json({ id: match.id });
}
