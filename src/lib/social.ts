import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// 组队人数上限与 3v3 单队人数一致：自己 + 2 名好友。
export const PARTY_MAX = 3;

export type SocialPlayer = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  rankTitle: string;
  ratings: Array<{ mode: string; rating: number }>;
};

type UserWithRatings = Prisma.UserGetPayload<{ include: { ratings: true } }>;

export function serializePlayer(user: UserWithRatings): SocialPlayer {
  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    avatar: user.avatar,
    rankTitle: user.rankTitle,
    ratings: user.ratings.map((rating) => ({ mode: rating.mode, rating: rating.rating })),
  };
}

// 已互为好友的用户列表。
export async function getFriendsOf(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { include: { ratings: true } },
      addressee: { include: { ratings: true } },
    },
    orderBy: { respondedAt: "desc" },
  });
  return friendships.map((friendship) => ({
    friendshipId: friendship.id,
    friend: serializePlayer(
      friendship.requesterId === userId ? friendship.addressee : friendship.requester,
    ),
  }));
}

export const partyInclude = {
  leader: { include: { ratings: true } },
  members: {
    include: { user: { include: { ratings: true } } },
    orderBy: { seat: "asc" },
  },
} satisfies Prisma.PartyInclude;

export type PartyWithMembers = Prisma.PartyGetPayload<{ include: typeof partyInclude }>;

// 当前所在队伍（作为队长或成员）。
export async function getActivePartyFor(userId: string): Promise<PartyWithMembers | null> {
  const membership = await prisma.partyMember.findUnique({
    where: { userId },
    select: { partyId: true },
  });
  if (!membership) return null;
  return prisma.party.findUnique({
    where: { id: membership.partyId },
    include: partyInclude,
  });
}

export function serializeParty(party: PartyWithMembers, viewerId: string) {
  return {
    id: party.id,
    leaderId: party.leaderId,
    isLeader: party.leaderId === viewerId,
    mode: party.mode,
    type: party.type,
    matchId: party.matchId,
    maxMembers: PARTY_MAX,
    members: party.members.map((member) => ({
      seat: member.seat,
      ...serializePlayer(member.user),
    })),
  };
}

// 队长视角：整队的用户 id（含自己）。仅当自己是队长且队伍大于 1 人时返回整队。
export async function getPartyForLeader(userId: string) {
  const party = await getActivePartyFor(userId);
  if (!party || party.leaderId !== userId) return null;
  return party;
}

// 匹配接口使用的组队上下文：无队伍时按单人处理。
export async function getPartyContext(userId: string) {
  const party = await getActivePartyFor(userId);
  if (!party) {
    return { party: null, size: 1, isLeader: true, memberIds: [userId] };
  }
  return {
    party,
    size: party.members.length,
    isLeader: party.leaderId === userId,
    memberIds: party.members.map((member) => member.userId),
  };
}

export async function getPendingPartyInvitesFor(userId: string) {
  const invites = await prisma.partyInvite.findMany({
    where: { inviteeId: userId, status: "PENDING" },
    include: {
      inviter: { include: { ratings: true } },
      party: { include: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return invites.map((invite) => ({
    id: invite.id,
    partyId: invite.partyId,
    mode: invite.party.mode,
    type: invite.party.type,
    memberCount: invite.party.members.length,
    inviter: serializePlayer(invite.inviter),
  }));
}
