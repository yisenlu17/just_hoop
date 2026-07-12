import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActivePartyFor,
  getPendingPartyInvitesFor,
  serializeParty,
  serializePlayer,
} from "@/lib/social";

const createSchema = z.object({
  mode: z.enum(["CASUAL", "RANKED"]).optional(),
});

// 当前队伍状态 + 收到的组队邀请（大厅轮询用）。
export async function GET() {
  const user = await requireCurrentUser();
  const [party, invites] = await Promise.all([
    getActivePartyFor(user.id),
    getPendingPartyInvitesFor(user.id),
  ]);
  const outgoingInvites = party
    ? (
        await prisma.partyInvite.findMany({
          where: { partyId: party.id, status: "PENDING" },
          include: { invitee: { include: { ratings: true } } },
          orderBy: { createdAt: "asc" },
        })
      ).map((invite) => ({ id: invite.id, invitee: serializePlayer(invite.invitee) }))
    : [];
  return NextResponse.json({
    party: party ? serializeParty(party, user.id) : null,
    invites,
    outgoingInvites,
  });
}

// 建队（点席位 + 时若还没有队伍）。已在队伍中则直接返回该队伍。
export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  const mode = parsed.success ? parsed.data.mode ?? "CASUAL" : "CASUAL";

  const existing = await getActivePartyFor(user.id);
  if (existing) {
    return NextResponse.json({ party: serializeParty(existing, user.id) });
  }

  const party = await prisma.party.create({
    data: {
      leaderId: user.id,
      mode,
      type: "THREE_V_THREE",
      members: { create: { userId: user.id, seat: 1 } },
    },
    include: {
      leader: { include: { ratings: true } },
      members: {
        include: { user: { include: { ratings: true } } },
        orderBy: { seat: "asc" },
      },
    },
  });
  return NextResponse.json({ party: serializeParty(party, user.id) });
}

const updateSchema = z.object({
  mode: z.enum(["CASUAL", "RANKED"]),
});

// 队长切换 匹配/排位,让队员看到一致的队伍状态。
export async function PATCH(request: NextRequest) {
  const user = await requireCurrentUser();
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "参数错误" }, { status: 400 });

  const party = await getActivePartyFor(user.id);
  if (!party || party.leaderId !== user.id) {
    return NextResponse.json({ error: "只有队长可以修改" }, { status: 403 });
  }
  await prisma.party.update({ where: { id: party.id }, data: { mode: parsed.data.mode } });
  return NextResponse.json({ ok: true });
}

// 退出队伍：队长退出即解散，队员退出仅移除自己。
export async function DELETE() {
  const user = await requireCurrentUser();
  const party = await getActivePartyFor(user.id);
  if (!party) return NextResponse.json({ ok: true });

  if (party.leaderId === user.id) {
    await prisma.party.delete({ where: { id: party.id } });
  } else {
    await prisma.partyMember.delete({ where: { userId: user.id } });
  }
  return NextResponse.json({ ok: true });
}
