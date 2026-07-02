import Link from "next/link";
import {
  Activity,
  Banknote,
  CalendarPlus,
  ClipboardCheck,
  FileWarning,
  ListChecks,
  Radio,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminTable,
  AdminTableHead,
} from "@/components/admin/AdminUI";
import { adminDate, ADMIN_ACTION_LABEL, badgeTone } from "@/lib/admin-domain";
import {
  formatLocation,
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  STATUS_META,
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsers,
    totalMatches,
    todayMatches,
    rankedMatches,
    pendingReferees,
    pendingDisputes,
    pendingPayments,
    liveMatches,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.match.count(),
    prisma.match.count({ where: { createdAt: { gte: today } } }),
    prisma.match.count({ where: { mode: "RANKED" } }),
    prisma.refereeApplication.count({ where: { status: "PENDING" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.payment.count({ where: { status: "MANUAL_REVIEW" } }),
    prisma.match.findMany({
      where: { status: { in: ["LIVE", "PAUSED", "PRE_CHECK"] } },
      include: { referee: true, players: true },
      orderBy: { scheduledAt: "asc" },
      take: 8,
    }),
    prisma.adminLog.findMany({
      include: { admin: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="平台总览"
        description="查看平台运行情况、当前比赛和需要管理员优先处理的事项。"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="总用户数" value={totalUsers} detail={`今日 +${newUsers}`} icon={<UsersRound className="h-4 w-4" />} />
        <AdminStatCard label="今日新增用户" value={newUsers} detail="从今日 00:00 起" tone="cyan" icon={<CalendarPlus className="h-4 w-4" />} />
        <AdminStatCard label="总比赛数" value={totalMatches} detail={`今日 ${todayMatches} 场`} icon={<ListChecks className="h-4 w-4" />} />
        <AdminStatCard label="今日比赛数" value={todayMatches} detail="按创建时间统计" tone="green" icon={<Radio className="h-4 w-4" />} />
        <AdminStatCard label="排位比赛数" value={rankedMatches} detail="全部历史排位" tone="violet" icon={<Trophy className="h-4 w-4" />} />
        <AdminStatCard label="待审批裁判" value={pendingReferees} detail="需要资格审核" tone="orange" icon={<ClipboardCheck className="h-4 w-4" />} />
        <AdminStatCard label="待处理申诉" value={pendingDisputes} detail="含处理中记录" tone="red" icon={<FileWarning className="h-4 w-4" />} />
        <AdminStatCard label="待确认支付" value={pendingPayments} detail="已上传支付凭证" tone="cyan" icon={<Banknote className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminPanel>
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <h2 className="font-black text-white">当前进行中的比赛</h2>
              <p className="mt-1 text-xs text-slate-600">直播、暂停和赛前检查中的比赛</p>
            </div>
            <Link href="/admin/matches" className="text-xs font-bold text-orange-300 hover:text-orange-200">
              查看全部
            </Link>
          </div>
          {liveMatches.length ? (
            <AdminTable>
              <AdminTableHead>
                <th className="px-5 py-3">比赛</th>
                <th className="px-4 py-3">模式</th>
                <th className="px-4 py-3">地点</th>
                <th className="px-4 py-3">比分</th>
                <th className="px-4 py-3">裁判</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-5 py-3 text-right">操作</th>
              </AdminTableHead>
              <tbody className="divide-y divide-white/6">
                {liveMatches.map((match) => (
                  <tr key={match.id} className="text-sm hover:bg-white/[0.018]">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-100">{match.title}</div>
                      <div className="mt-1 text-xs text-slate-600">{match.code}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{MATCH_MODE_LABEL[match.mode]} · {MATCH_TYPE_LABEL[match.type]}</td>
                    <td className="max-w-48 truncate px-4 py-4 text-slate-400">{formatLocation(match)}</td>
                    <td className="px-4 py-4 font-black text-white">{match.teamAScore}:{match.teamBScore}</td>
                    <td className="px-4 py-4 text-slate-400">{match.referee?.name ?? "未分配"}</td>
                    <td className="px-4 py-4"><AdminBadge tone={badgeTone(match.status)}>{STATUS_META[match.status]?.label ?? match.status}</AdminBadge></td>
                    <td className="px-5 py-4 text-right"><Link href={`/admin/matches/${match.id}`} className="font-bold text-orange-300">查看</Link></td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmpty>当前没有进行中的比赛。</AdminEmpty>
          )}
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel>
            <div className="border-b border-white/8 px-5 py-4">
              <h2 className="font-black text-white">待办事项</h2>
            </div>
            <div className="space-y-2 p-3">
              {[
                { href: "/admin/referee-applications?status=PENDING", label: "裁判资格待审批", value: pendingReferees, tone: "orange" as const },
                { href: "/admin/disputes?status=OPEN", label: "用户申诉待处理", value: pendingDisputes, tone: "red" as const },
                { href: "/admin/payments?status=MANUAL_REVIEW", label: "支付凭证待确认", value: pendingPayments, tone: "cyan" as const },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-lg px-3 py-3 transition hover:bg-white/5">
                  <span className="text-sm font-semibold text-slate-300">{item.label}</span>
                  <AdminBadge tone={item.tone}>{item.value}</AdminBadge>
                </Link>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h2 className="font-black text-white">最近管理操作</h2>
              <Link href="/admin/logs" className="text-xs font-bold text-orange-300">全部</Link>
            </div>
            <div className="divide-y divide-white/6 px-5">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-3.5 w-3.5 text-slate-600" />
                    <span className="font-bold text-slate-200">{ADMIN_ACTION_LABEL[log.action] ?? log.action}</span>
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">{log.admin.name} · {adminDate(log.createdAt)}</div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
