import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const respondSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);
  const parsed = respondSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "参数错误" }, { status: 400 });

  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || friendship.addresseeId !== user.id) {
    return NextResponse.json({ error: "申请不存在" }, { status: 404 });
  }
  if (friendship.status !== "PENDING") {
    return NextResponse.json({ error: "申请已处理" }, { status: 409 });
  }

  await prisma.friendship.update({
    where: { id },
    data: {
      status: parsed.data.action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}

// 删除好友或撤回自己发出的申请。
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || (friendship.requesterId !== user.id && friendship.addresseeId !== user.id)) {
    return NextResponse.json({ error: "关系不存在" }, { status: 404 });
  }
  await prisma.friendship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
