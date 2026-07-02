import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import {
  capacityForType,
  formatLocation,
  formatMoney,
  formatTime,
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  scheduledAtFrom,
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
  ratingMin: z.number().int().min(0).max(3000).optional(),
  ratingMax: z.number().int().min(0).max(3000).optional(),
});

export type MatchmakingInput = z.infer<typeof matchmakingSchema>;

export function normalizeMatchmakingInput(input: MatchmakingInput) {
  const ratingMin = input.mode === "RANKED" ? input.ratingMin ?? 900 : undefined;
  const ratingMax = input.mode === "RANKED" ? input.ratingMax ?? 1400 : undefined;
  return {
    ...input,
    skillLevel: input.mode === "CASUAL" ? input.skillLevel ?? "OPEN" : undefined,
    ratingMin,
    ratingMax: ratingMax && ratingMin && ratingMax < ratingMin ? ratingMin : ratingMax,
  };
}

export function buildMatchmakingWhere(input: MatchmakingInput, userId: string): Prisma.MatchWhereInput {
  const normalized = normalizeMatchmakingInput(input);
  const skillLevel = normalized.skillLevel ?? "OPEN";
  const start = new Date(`${normalized.date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    mode: normalized.mode,
    type: normalized.type,
    status: {
      in: ["OPEN", "PENDING_PAYMENT", "PENDING_REFEREE"],
    },
    scheduledAt: {
      gte: start,
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
        userId,
      },
    },
  };
}

export const matchmakingInclude = matchInclude;

export function ratingOverlaps(match: Pick<MatchWithRelations, "ratingMin" | "ratingMax">, input: MatchmakingInput) {
  const normalized = normalizeMatchmakingInput(input);
  if (normalized.mode !== "RANKED") return true;
  const requestedMin = normalized.ratingMin ?? 0;
  const requestedMax = normalized.ratingMax ?? 3000;
  const roomMin = match.ratingMin ?? 0;
  const roomMax = match.ratingMax ?? 3000;
  return roomMin <= requestedMax && roomMax >= requestedMin;
}

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
    ratingMin: match.ratingMin,
    ratingMax: match.ratingMax,
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
