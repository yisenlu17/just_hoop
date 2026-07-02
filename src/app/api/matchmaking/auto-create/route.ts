import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import {
  autoCreateCourt,
  autoCreateScheduledAt,
  autoCreateTitle,
  matchmakingSchema,
  normalizeMatchmakingInput,
  targetPlayersFor,
} from "@/lib/matchmaking";
import { prisma } from "@/lib/prisma";

function codeFor(mode: "CASUAL" | "RANKED") {
  return `JH-${mode === "RANKED" ? "R" : "M"}${Date.now().toString().slice(-5)}`;
}

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = matchmakingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "筛选条件不完整" }, { status: 400 });
  }

  const input = normalizeMatchmakingInput(parsed.data);
  const referee = input.mode === "RANKED" ? await prisma.user.findFirst({ where: { isReferee: true, status: "ACTIVE" } }) : null;
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
      ratingMin: input.ratingMin,
      ratingMax: input.ratingMax,
      scheduledAt: autoCreateScheduledAt(input),
      maxPlayers: targetPlayersFor(input),
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
          note: "按筛选条件自动创建等待房间",
          payload: JSON.parse(JSON.stringify(input)),
        },
      },
    },
  });

  return NextResponse.json({ id: match.id });
}
