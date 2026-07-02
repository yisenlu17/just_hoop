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

export const TIME_SLOT_LABEL: Record<string, string> = {
  MORNING: "上午",
  AFTERNOON: "下午",
  EVENING: "晚间",
  NIGHT: "夜场",
};

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
  const hourBySlot: Record<string, string> = {
    MORNING: "09:00:00",
    AFTERNOON: "14:00:00",
    EVENING: "19:00:00",
    NIGHT: "21:00:00",
  };
  return new Date(`${date}T${hourBySlot[timeSlot] ?? "19:00:00"}`);
}

export function rankTitleFromRating(rating: number) {
  if (rating >= 1500) return "钻石";
  if (rating >= 1300) return "铂金";
  if (rating >= 1150) return "黄金";
  if (rating >= 1000) return "白银";
  return "青铜";
}

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
