import { PrismaClient } from "@/generated/prisma/client";
import { rankTitleFromRating } from "@/lib/domain";

const expectedScore = (rating: number, opponentRating: number) =>
  1 / (1 + 10 ** ((opponentRating - rating) / 400));

function kFactor(rating: number) {
  if (rating < 1100) return 40;
  if (rating > 1400) return 24;
  return 32;
}

export async function settleRankedMatch(prisma: PrismaClient, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      players: {
        include: {
          user: {
            include: {
              ratings: true,
            },
          },
        },
      },
    },
  });

  if (!match || match.mode !== "RANKED" || !match.winnerTeam || match.status === "CONFIRMED") {
    return null;
  }

  const teamA = match.players.filter((player) => player.team === "A");
  const teamB = match.players.filter((player) => player.team === "B");
  if (!teamA.length || !teamB.length) return null;

  const ratingFor = (player: (typeof match.players)[number]) =>
    player.user.ratings.find((rating) => rating.mode === match.type)?.rating ?? 1000;

  const average = (players: typeof teamA) =>
    Math.round(players.reduce((total, player) => total + ratingFor(player), 0) / players.length);

  const averageA = average(teamA);
  const averageB = average(teamB);
  const winnerScoreA = match.winnerTeam === "A" ? 1 : 0;
  const updates = match.players.map(async (player) => {
    const playerRating = ratingFor(player);
    const opponentAverage = player.team === "A" ? averageB : averageA;
    const actual = player.team === "A" ? winnerScoreA : 1 - winnerScoreA;
    const expected = expectedScore(playerRating, opponentAverage);
    const delta = Math.round(kFactor(playerRating) * (actual - expected));
    const nextRating = Math.max(100, playerRating + delta);

    const existing = player.user.ratings.find((rating) => rating.mode === match.type);
    await prisma.playerRating.upsert({
      where: {
        userId_mode: {
          userId: player.userId,
          mode: match.type,
        },
      },
      create: {
        userId: player.userId,
        mode: match.type,
        rating: nextRating,
        wins: actual === 1 ? 1 : 0,
        losses: actual === 1 ? 0 : 1,
        streak: actual === 1 ? 1 : -1,
        pointsFor: player.team === "A" ? match.teamAScore : match.teamBScore,
        pointsAgainst: player.team === "A" ? match.teamBScore : match.teamAScore,
      },
      update: {
        rating: nextRating,
        wins: { increment: actual === 1 ? 1 : 0 },
        losses: { increment: actual === 1 ? 0 : 1 },
        streak: actual === 1 ? Math.max(1, (existing?.streak ?? 0) + 1) : Math.min(-1, (existing?.streak ?? 0) - 1),
        pointsFor: { increment: player.team === "A" ? match.teamAScore : match.teamBScore },
        pointsAgainst: { increment: player.team === "A" ? match.teamBScore : match.teamAScore },
      },
    });

    await prisma.user.update({
      where: { id: player.userId },
      data: {
        rankTitle: rankTitleFromRating(nextRating),
      },
    });

    return { userId: player.userId, delta, nextRating };
  });

  const results = await Promise.all(updates);
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "CONFIRMED" },
  });
  return results;
}
