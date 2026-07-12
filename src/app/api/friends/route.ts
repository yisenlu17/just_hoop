import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFriendsOf, serializePlayer } from "@/lib/social";

const createSchema = z.object({
  handle: z.string().trim().min(1).max(40).optional(),
  userId: z.string().trim().min(1).optional(),
});

export async function GET() {
  const user = await requireCurrentUser();
  const [friends, pending] = await Promise.all([
    getFriendsOf(user.id),
    prisma.friendship.findMany({
      where: {
        status: "PENDING",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
      include: {
        requester: { include: { ratings: true } },
        addressee: { include: { ratings: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const relatedIds = new Set<string>([user.id]);
  for (const item of friends) relatedIds.add(item.friend.id);
  for (const item of pending) {
    relatedIds.add(item.requesterId);
    relatedIds.add(item.addresseeId);
  }
  const suggestions = await prisma.user.findMany({
    where: {
      id: { notIn: [...relatedIds] },
      status: "ACTIVE",
      isAdmin: false,
    },
    include: { ratings: true },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  return NextResponse.json({
    friends,
    incoming: pending
      .filter((item) => item.addresseeId === user.id)
      .map((item) => ({ id: item.id, from: serializePlayer(item.requester) })),
    outgoing: pending
      .filter((item) => item.requesterId === user.id)
      .map((item) => ({ id: item.id, to: serializePlayer(item.addressee) })),
    suggestions: suggestions.map(serializePlayer),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success || (!parsed.data.handle && !parsed.data.userId)) {
    return NextResponse.json({ error: "请输入球员 ID" }, { status: 400 });
  }

  const target = parsed.data.userId
    ? await prisma.user.findUnique({ where: { id: parsed.data.userId } })
    : await prisma.user.findFirst({
        where: {
          OR: [
            { handle: { equals: parsed.data.handle, mode: "insensitive" } },
            { name: parsed.data.handle },
          ],
        },
      });
  if (!target) return NextResponse.json({ error: "没有找到这个球员" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "不能添加自己" }, { status: 400 });

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: user.id },
      ],
    },
  });

  if (existing?.status === "ACCEPTED") {
    return NextResponse.json({ error: "你们已经是好友了" }, { status: 409 });
  }
  if (existing?.status === "PENDING") {
    if (existing.requesterId === user.id) {
      return NextResponse.json({ error: "申请已发送，等待对方接受" }, { status: 409 });
    }
    // 对方先发过申请：直接互相成为好友。
    await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    return NextResponse.json({ ok: true, accepted: true });
  }
  if (existing) {
    // 之前被拒绝过，重新发起。
    await prisma.friendship.update({
      where: { id: existing.id },
      data: {
        requesterId: user.id,
        addresseeId: target.id,
        status: "PENDING",
        respondedAt: null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.friendship.create({
    data: { requesterId: user.id, addresseeId: target.id },
  });
  return NextResponse.json({ ok: true });
}
