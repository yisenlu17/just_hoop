export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "正常",
  BANNED: "封禁",
  PENDING_REVIEW: "待审核",
};

export const REFEREE_APPLICATION_STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "待支付",
  PENDING: "待支付",
  MANUAL_REVIEW: "人工确认",
  PAID: "已支付",
  REFUNDED: "已退款",
};

export const DISPUTE_STATUS_LABEL: Record<string, string> = {
  OPEN: "待处理",
  REVIEWING: "处理中",
  RESOLVED: "已解决",
  REJECTED: "已驳回",
};

export const ADMIN_ACTION_LABEL: Record<string, string> = {
  BAN_USER: "封禁用户",
  UPDATE_USER_STATUS: "更新用户状态",
  ADJUST_USER_CREDIT: "调整信用分",
  UPDATE_USER_NOTE: "更新用户备注",
  APPROVE_REFEREE_APPLICATION: "通过裁判申请",
  REJECT_REFEREE_APPLICATION: "拒绝裁判申请",
  CANCEL_MATCH: "取消比赛",
  INVALIDATE_MATCH: "标记比赛无效",
  UPDATE_MATCH_RESULT: "修改比赛结果",
  ASSIGN_MATCH_REFEREE: "分配比赛裁判",
  UPDATE_MATCH_NOTE: "更新比赛备注",
  REVIEW_DISPUTE: "开始处理申诉",
  RESOLVE_DISPUTE: "解决申诉",
  REJECT_DISPUTE: "驳回申诉",
  CONFIRM_PAYMENT: "人工确认支付",
  REFUND_PAYMENT: "标记退款",
  UPDATE_PAYMENT_STATUS: "更新支付状态",
};

export function adminDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function badgeTone(value: string) {
  if (["ACTIVE", "APPROVED", "PAID", "RESOLVED", "CONFIRMED"].includes(value)) return "green" as const;
  if (["BANNED", "REJECTED", "INVALID", "DISPUTED"].includes(value)) return "red" as const;
  if (["PENDING", "PENDING_REVIEW", "OPEN", "MANUAL_REVIEW", "PENDING_PAYMENT"].includes(value)) return "orange" as const;
  if (["REVIEWING", "LIVE", "SCHEDULED", "PRE_CHECK"].includes(value)) return "cyan" as const;
  return "gray" as const;
}
