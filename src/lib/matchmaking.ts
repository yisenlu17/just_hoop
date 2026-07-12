import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import {
  capacityForType,
  formatLocation,
  formatMoney,
  formatTime,
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  RANK_TIERS,
  RANK_TIER_ORDER,
  rankFromRating,
  scheduledAtFrom,
  shanghaiDayRange,
  SKILL_LEVEL_LABEL,
  TIME_SLOT_LABEL,
} from "@/lib/domain";
import { matchInclude, type MatchWithRelations } from "@/lib/data";

export const matchmakingSchema = z.object({
  mode: z.enum(["CASUAL", "RANKED"]),
  type: z.enum(["ONE_V_ONE", "THREE_V_THREE"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]),
  city: z.string().min(1).max(30),
  district: z.string().min(1).max(30),
  gym: z.string().min(1).max(50),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "OPEN"]).optional(),
});

export type MatchmakingInput = z.infer<typeof matchmakingSchema>;

export function normalizeMatchmakingInput(input: MatchmakingInput) {
  return {
    ...input,
    skillLevel: input.mode === "CASUAL" ? input.skillLevel ?? "OPEN" : undefined,
  };
}

type RatingCarrier = { ratings: Array<{ mode: string; rating: number }> };

export function ratingForMatchType(player: RatingCarrier, type: string) {
  return player.ratings.find((rating) => rating.mode === type)?.rating ?? 1000;
}

function rankTierIndex(player: RatingCarrier, type: string) {
  const key = rankFromRating(ratingForMatchType(player, type)).key;
  return RANK_TIER_ORDER.indexOf(key);
}

export function rankedGroupIsCompatible(players: RatingCarrier[], type: string) {
  const indexes = players.map((player) => rankTierIndex(player, type));
  return !indexes.length || Math.max(...indexes) - Math.min(...indexes) <= 1;
}

export function rankedRoomAllowsPlayers(
  match: Pick<MatchWithRelations, "type" | "players">,
  candidates: RatingCarrier[],
) {
  return rankedGroupIsCompatible(
    [...match.players.map((player) => player.user), ...candidates],
    match.type,
  );
}

// 房间保留数字区间仅用于兼容数据库和后台；玩家端不会显示或手动选择。
export function rankedRatingWindow(players: RatingCarrier[], type: string) {
  const indexes = players.map((player) => rankTierIndex(player, type));
  const lowest = Math.min(...indexes);
  const highest = Math.max(...indexes);
  const allowedLowest = Math.max(0, highest - 1);
  const allowedHighest = Math.min(RANK_TIERS.length - 1, lowest + 1);
  return {
    min: allowedLowest === 0 ? 0 : RANK_TIERS[allowedLowest].base,
    max:
      allowedHighest === RANK_TIERS.length - 1
        ? 3000
        : RANK_TIERS[allowedHighest + 1].base - 1,
  };
}

// 整队寻找可容纳 size 人的同队位置；返回每个人的 (team, slot)，放不下返回 null。
export function teamPlacementFor(
  players: Array<{ team: string }>,
  type: string,
  size: number,
): Array<{ team: string; slot: number }> | null {
  const perTeam = type === "THREE_V_THREE" ? 3 : 1;
  const a = players.filter((player) => player.team === "A").length;
  const b = players.filter((player) => player.team === "B").length;
  const freeA = perTeam - a;
  const freeB = perTeam - b;
  let team: "A" | "B" | null = null;
  if (freeA >= size && (a <= b || freeB < size)) team = "A";
  else if (freeB >= size) team = "B";
  else if (freeA >= size) team = "A";
  if (!team) return null;
  const base = team === "A" ? a : b;
  return Array.from({ length: size }, (_, index) => ({ team: team as string, slot: base + index + 1 }));
}

export function buildMatchmakingWhere(input: MatchmakingInput, userIds: string[]): Prisma.MatchWhereInput {
  const normalized = normalizeMatchmakingInput(input);
  const skillLevel = normalized.skillLevel ?? "OPEN";
  const { start, end } = shanghaiDayRange(normalized.date);
  const upcomingStart = new Date(Math.max(start.getTime(), Date.now()));

  return {
    mode: normalized.mode,
    type: normalized.type,
    status: {
      in: ["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE"],
    },
    scheduledAt: {
      gte: upcomingStart,
      lt: end,
    },
    timeSlot: normalized.timeSlot,
    ...(normalized.city !== "ALL" ? { city: normalized.city } : {}),
    ...(normalized.district !== "ALL" ? { district: normalized.district } : {}),
    ...(normalized.gym !== "ALL" ? { gym: normalized.gym } : {}),
    ...(normalized.mode === "CASUAL" && skillLevel !== "OPEN"
      ? {
          skillLevel: {
            in: [skillLevel, "OPEN"],
          },
        }
      : {}),
    players: {
      none: {
        userId: { in: userIds },
      },
    },
  };
}

export const matchmakingInclude = matchInclude;

export function serializeMatchForMatchmaking(match: MatchWithRelations) {
  return {
    id: match.id,
    code: match.code,
    title: match.title,
    mode: match.mode,
    type: match.type,
    status: match.status,
    court: match.court,
    city: match.city,
    district: match.district,
    gym: match.gym,
    location: formatLocation(match),
    scheduledAt: match.scheduledAt?.toISOString() ?? null,
    scheduledLabel: formatTime(match.scheduledAt),
    timeSlot: match.timeSlot,
    timeSlotLabel: match.timeSlot ? TIME_SLOT_LABEL[match.timeSlot] ?? match.timeSlot : "时间待定",
    skillLevel: match.skillLevel,
    skillLevelLabel: match.skillLevel ? SKILL_LEVEL_LABEL[match.skillLevel] ?? match.skillLevel : null,
    playerCount: match.players.length,
    maxPlayers: match.maxPlayers,
    buyInLabel: formatMoney(match.buyInCents),
    refereeName: match.referee?.name ?? null,
    players: match.players.map((player) => ({
      id: player.user.id,
      name: player.user.name,
      handle: player.user.handle,
      avatar: player.user.avatar,
      team: player.team,
    })),
  };
}

export function autoCreateTitle(input: MatchmakingInput) {
  const mode = MATCH_MODE_LABEL[input.mode];
  const type = MATCH_TYPE_LABEL[input.type];
  return `${mode} ${type} 等待房`;
}

export function autoCreateCourt(input: MatchmakingInput) {
  if (input.gym !== "ALL") return input.gym;
  if (input.district !== "ALL") return `${input.district}推荐球馆`;
  if (input.city !== "ALL") return `${input.city}推荐球馆`;
  return "系统推荐球馆";
}

export function autoCreateScheduledAt(input: MatchmakingInput) {
  return scheduledAtFrom(input.date, input.timeSlot);
}

export function targetPlayersFor(input: MatchmakingInput) {
  return capacityForType(input.type);
}
