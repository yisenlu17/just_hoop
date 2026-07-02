import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const disputeSchema = z.object({
  reason: z.string().min(4).max(200),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);
  const parsed = disputeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "请填写争议原因" }, { status: 400 });
  }

  await prisma.dispute.create({
    data: {
      matchId: id,
      creatorId: user.id,
      reason: parsed.data.reason,
    },
  });
  await prisma.match.update({
    where: { id },
    data: {
      status: "DISPUTED",
      events: {
        create: {
          actorId: user.id,
          type: "DISPUTE",
          note: parsed.data.reason,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
