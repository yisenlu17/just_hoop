import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const matchInclude = {
  players: {
    include: {
      user: {
        include: {
          ratings: true,
        },
      },
    },
    orderBy: [{ team: "asc" }, { slot: "asc" }],
  },
  referee: true,
  createdBy: true,
  events: {
    include: {
      actor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  },
  disputes: {
    include: {
      creator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.MatchInclude;

export type MatchWithRelations = Prisma.MatchGetPayload<{
  include: typeof matchInclude;
}>;

export async function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });
}

export async function getMatches(where: Prisma.MatchWhereInput = {}) {
  return prisma.match.findMany({
    where,
    include: matchInclude,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function getLeaderboard(mode: "ONE_V_ONE" | "THREE_V_THREE" = "ONE_V_ONE") {
  return prisma.playerRating.findMany({
    where: { mode },
    include: { user: true },
    orderBy: [{ rating: "desc" }, { wins: "desc" }],
    take: 20,
  });
}

export async function getAccounts() {
  return prisma.user.findMany({
    include: {
      ratings: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}
