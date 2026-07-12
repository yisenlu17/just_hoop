export const MATCH_TYPE_LABEL: Record<string, string> = {
  ONE_V_ONE: "1V1",
  THREE_V_THREE: "3V3",
};

export const MATCH_MODE_LABEL: Record<string, string> = {
  CASUAL: "匹配",
  RANKED: "排位",
};

export const ROLE_LABEL: Record<string, string> = {
  PLAYER: "球员",
  REFEREE: "裁判",
  ADMIN: "运营",
};

export const STATUS_META: Record<
  string,
  { label: string; tone: "blue" | "green" | "orange" | "red" | "gold" | "gray" }
> = {
  DRAFT: { label: "草稿", tone: "gray" },
  OPEN: { label: "等待加入", tone: "green" },
  FULL: { label: "已满员", tone: "gold" },
  PENDING_PAYMENT: { label: "待支付", tone: "orange" },
  PENDING_REFEREE: { label: "待裁判", tone: "orange" },
  SCHEDULED: { label: "已排期", tone: "blue" },
  PRE_CHECK: { label: "赛前检查", tone: "blue" },
  LIVE: { label: "进行中", tone: "green" },
  PAUSED: { label: "暂停", tone: "orange" },
  FINISHED: { label: "待确认", tone: "gold" },
  CONFIRMED: { label: "已结算", tone: "green" },
  INVALID: { label: "无效赛", tone: "red" },
  DISPUTED: { label: "争议中", tone: "red" },
  CANCELLED: { label: "已取消", tone: "gray" },
};

export const TIME_SLOT_META = {
  MORNING: { label: "上午", range: "06:00–11:59", defaultTime: "09:00" },
  AFTERNOON: { label: "下午", range: "12:00–17:59", defaultTime: "14:00" },
  EVENING: { label: "晚间", range: "18:00–21:59", defaultTime: "19:30" },
  NIGHT: { label: "夜场", range: "22:00–次日 01:59", defaultTime: "22:30" },
} as const;

export type TimeSlotKey = keyof typeof TIME_SLOT_META;

export const TIME_SLOT_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(TIME_SLOT_META).map(([key, value]) => [key, value.label]),
);

export const SKILL_LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "新手友好",
  INTERMEDIATE: "稳定对抗",
  ADVANCED: "高强度",
  OPEN: "不限水平",
};

export const EVENT_LABEL: Record<string, string> = {
  CREATE: "创建房间",
  JOIN: "加入房间",
  LEAVE: "离开房间",
  UPLOAD_STREAM: "上传直播",
  CHECK_IN: "球员签到",
  PRE_CHECK: "赛前检查",
  START: "比赛开始",
  SCORE: "计分",
  FOUL: "犯规",
  TIMEOUT: "暂停申请",
  UNDO: "撤回",
  PAUSE: "暂停",
  RESUME: "继续",
  END: "结束比赛",
  CONFIRM: "确认结算",
  INVALID: "判为无效",
  DISPUTE: "提交争议",
  PAYMENT: "支付状态",
};

export function capacityForType(type: string) {
  return type === "THREE_V_THREE" ? 6 : 2;
}

export function formatMoney(cents: number) {
  if (!cents) return "免费";
  return `¥${(cents / 100).toFixed(0)}`;
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "待定";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatLocation(match: {
  city?: string | null;
  district?: string | null;
  gym?: string | null;
  court: string;
}) {
  const parts = [match.city, match.district, match.gym ?? match.court].filter(Boolean);
  return parts.length ? parts.join(" · ") : match.court;
}

export function scheduledAtFrom(date: string, timeSlot: string) {
  const slot = TIME_SLOT_META[timeSlot as TimeSlotKey] ?? TIME_SLOT_META.EVENING;
  return new Date(`${date}T${slot.defaultTime}:00+08:00`);
}

export function shanghaiDayRange(date: string) {
  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function parseShanghaiLocalDateTime(value: string) {
  return new Date(`${value}:00+08:00`);
}

export function timeSlotFromDate(value: Date): TimeSlotKey | null {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(value),
  );
  if (hour >= 6 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 18) return "AFTERNOON";
  if (hour >= 18 && hour < 22) return "EVENING";
  if (hour >= 22 || hour < 2) return "NIGHT";
  return null;
}

export type RankTierKey =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "KING";

type RankTierDef = { key: RankTierKey; name: string; base: number; divisions: number };

// 每个小段跨 50 分、每大段 4 个小段（共 200 分），大段之间连续衔接。
// 初始分 1000 = 白银 IV；铂金起点 1400 与 K 系数高分档阈值对齐（见 lib/rating.ts）。
const RANK_STEP = 50;

export const RANK_TIERS: RankTierDef[] = [
  { key: "BRONZE", name: "青铜", base: 800, divisions: 4 },
  { key: "SILVER", name: "白银", base: 1000, divisions: 4 },
  { key: "GOLD", name: "黄金", base: 1200, divisions: 4 },
  { key: "PLATINUM", name: "铂金", base: 1400, divisions: 4 },
  { key: "DIAMOND", name: "钻石", base: 1600, divisions: 4 },
  { key: "MASTER", name: "大师", base: 1800, divisions: 4 },
  { key: "KING", name: "王者", base: 2000, divisions: 1 },
];

export const RANK_TIER_ORDER = RANK_TIERS.map((tier) => tier.key);

const ROMAN = ["", "I", "II", "III", "IV", "V"];

export type RankDivision = {
  key: RankTierKey;
  tier: string;
  division: number | null;
  label: string;
  floor: number;
  ceil: number; // 上界（不含），顶段为 Infinity
};

// 从低到高的完整天梯（每个小段一档）。
export const RANK_LADDER: RankDivision[] = RANK_TIERS.flatMap((tier) => {
  if (tier.divisions <= 1) {
    return [
      {
        key: tier.key,
        tier: tier.name,
        division: null,
        label: tier.name,
        floor: tier.base,
        ceil: Number.POSITIVE_INFINITY,
      },
    ];
  }
  // 小段从低到高：III 在最低（tier.base），I 在最高。
  const rungs: RankDivision[] = [];
  for (let d = tier.divisions; d >= 1; d -= 1) {
    const floor = tier.base + (tier.divisions - d) * RANK_STEP;
    rungs.push({
      key: tier.key,
      tier: tier.name,
      division: d,
      label: `${tier.name} ${ROMAN[d]}`,
      floor,
      ceil: floor + RANK_STEP,
    });
  }
  return rungs;
});

export function rankFromRating(rating: number): RankDivision {
  let current = RANK_LADDER[0];
  for (const rung of RANK_LADDER) {
    if (rating >= rung.floor) current = rung;
    else break;
  }
  return current;
}

export function rankTitleFromRating(rating: number): string {
  return rankFromRating(rating).label;
}

// 当前小段内的进度，用于展示升段进度条。
export function rankProgress(rating: number) {
  const current = rankFromRating(rating);
  const index = RANK_LADDER.indexOf(current);
  const next = RANK_LADDER[index + 1] ?? null;
  const floor = current.floor;
  const ceil = next ? next.floor : current.floor;
  const span = ceil - floor;
  const pct = next ? Math.max(0, Math.min(100, Math.round(((rating - floor) / span) * 100))) : 100;
  const toNext = next ? Math.max(0, ceil - rating) : 0;
  return { current, next, floor, ceil, pct, toNext };
}

// 从段位称号文本反推大段（用于展示历史/非评分场景的着色）。
export function rankKeyFromTitle(title?: string | null): RankTierKey | null {
  if (!title) return null;
  return RANK_TIERS.find((tier) => title.startsWith(tier.name))?.key ?? null;
}

// 段位大段配色（徽章）。
export const RANK_TONE: Record<RankTierKey, string> = {
  BRONZE: "border-amber-700/55 bg-amber-800/25 text-amber-200",
  SILVER: "border-slate-300/45 bg-slate-300/12 text-slate-100",
  GOLD: "border-yellow-300/50 bg-yellow-300/14 text-yellow-100",
  PLATINUM: "border-teal-300/50 bg-teal-300/14 text-teal-100",
  DIAMOND: "border-sky-300/55 bg-sky-300/16 text-sky-100",
  MASTER: "border-fuchsia-300/55 bg-fuchsia-400/16 text-fuchsia-100",
  KING: "border-orange-300/60 bg-gradient-to-r from-red-500/25 to-orange-400/25 text-orange-50",
};

// 进度条填充色。
export const RANK_BAR: Record<RankTierKey, string> = {
  BRONZE: "bg-amber-500",
  SILVER: "bg-slate-300",
  GOLD: "bg-yellow-300",
  PLATINUM: "bg-teal-300",
  DIAMOND: "bg-sky-400",
  MASTER: "bg-fuchsia-400",
  KING: "bg-gradient-to-r from-red-400 to-orange-300",
};

export function toneClasses(tone: string) {
  const map: Record<string, string> = {
    blue: "border-cyan-400/35 bg-cyan-400/10 text-cyan-200 shadow-cyan-500/10",
    green: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200 shadow-emerald-500/10",
    orange: "border-orange-400/35 bg-orange-400/10 text-orange-200 shadow-orange-500/10",
    red: "border-red-400/40 bg-red-500/10 text-red-200 shadow-red-500/10",
    gold: "border-yellow-300/40 bg-yellow-300/10 text-yellow-100 shadow-yellow-500/10",
    gray: "border-white/15 bg-white/8 text-slate-300 shadow-black/20",
  };
  return map[tone] ?? map.gray;
}

export function nextTeam(players: Array<{ team: string }>, type: string) {
  const perTeam = type === "THREE_V_THREE" ? 3 : 1;
  const a = players.filter((player) => player.team === "A").length;
  const b = players.filter((player) => player.team === "B").length;
  if (a < perTeam && a <= b) return { team: "A", slot: a + 1 };
  if (b < perTeam) return { team: "B", slot: b + 1 };
  if (a < perTeam) return { team: "A", slot: a + 1 };
  return null;
}
