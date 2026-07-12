import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivePartyFor, PARTY_MAX, serializeParty } from "@/lib/social";

const inviteSchema = z.object({
  inviteeId: z.string().min(1),
  mode: z.enum(["CASUAL", "RANKED"]).optional(),
});

// 队长向好友发出组队邀请；还没有队伍时自动建队。
export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = inviteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "参数错误" }, { status: 400 });
  const { inviteeId, mode } = parsed.data;

  const isFriend = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: user.id, addresseeId: inviteeId },
        { requesterId: inviteeId, addresseeId: user.id },
      ],
    },
  });
  if (!isFriend) return NextResponse.json({ error: "只能邀请好友" }, { status: 403 });

  let party = await getActivePartyFor(user.id);
  if (!party) {
    await prisma.party.create({
      data: {
        leaderId: user.id,
        mode: mode ?? "CASUAL",
        type: "THREE_V_THREE",
        members: { create: { userId: user.id, seat: 1 } },
      },
    });
    party = await getActivePartyFor(user.id);
  }
  if (!party) return NextResponse.json({ error: "建队失败" }, { status: 500 });
  if (party.leaderId !== user.id) {
    return NextResponse.json({ error: "只有队长可以邀请" }, { status: 403 });
  }
  if (party.members.length >= PARTY_MAX) {
    return NextResponse.json({ error: "队伍已满" }, { status: 409 });
  }
  if (party.members.some((member) => member.userId === inviteeId)) {
    return NextResponse.json({ error: "对方已在队伍中" }, { status: 409 });
  }

  const pending = await prisma.partyInvite.findFirst({
    where: { partyId: party.id, inviteeId, status: "PENDING" },
  });
  if (pending) return NextResponse.json({ error: "邀请已发送，等待对方接受" }, { status: 409 });

  await prisma.partyInvite.create({
    data: { partyId: party.id, inviterId: user.id, inviteeId },
  });
  return NextResponse.json({ ok: true, party: serializeParty(party, user.id) });
}

const respondSchema = z.object({
  inviteId: z.string().min(1),
  action: z.enum(["ACCEPT", "DECLINE"]),
});

// 受邀人接受 / 拒绝组队邀请。
export async function PATCH(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = respondSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "参数错误" }, { status: 400 });
  const { inviteId, action } = parsed.data;

  const invite = await prisma.partyInvite.findUnique({
    where: { id: inviteId },
    include: { party: { include: { members: true } } },
  });
  if (!invite || invite.inviteeId !== user.id) {
    return NextResponse.json({ error: "邀请不存在" }, { status: 404 });
  }
  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "邀请已处理" }, { status: 409 });
  }

  if (action === "DECLINE") {
    await prisma.partyInvite.update({
      where: { id: inviteId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (invite.party.members.length >= PARTY_MAX) {
    await prisma.partyInvite.update({
      where: { id: inviteId },
      data: { status: "CANCELLED", respondedAt: new Date() },
    });
    return NextResponse.json({ error: "队伍已满" }, { status: 409 });
  }

  const currentParty = await getActivePartyFor(user.id);
  if (currentParty) {
    if (currentParty.id === invite.partyId) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "先退出当前队伍再接受邀请" }, { status: 409 });
  }

  const seat =
    Math.max(...invite.party.members.map((member) => member.seat), 0) + 1;
  await prisma.$transaction([
    prisma.partyMember.create({
      data: { partyId: invite.partyId, userId: user.id, seat },
    }),
    prisma.partyInvite.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    }),
    // 清理发给我的其它待处理邀请。
    prisma.partyInvite.updateMany({
      where: { inviteeId: user.id, status: "PENDING", id: { not: inviteId } },
      data: { status: "CANCELLED", respondedAt: new Date() },
    }),
  ]);
  return NextResponse.json({ ok: true, partyId: invite.partyId });
}
