import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Radio } from "lucide-react";
import { AdminActionForm } from "@/components/admin/AdminActions";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableHead,
  DetailItem,
} from "@/components/admin/AdminUI";
import {
  adminDate,
  badgeTone,
  DISPUTE_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/admin-domain";
import {
  EVENT_LABEL,
  formatLocation,
  formatMoney,
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  STATUS_META,
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const inputClass = "h-10 w-full rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-white outline-none focus:border-orange-400/45";
const textareaClass = "min-h-24 w-full rounded-lg border border-white/10 bg-[#080b11] p-3 text-sm text-white outline-none focus:border-orange-400/45";

export default async function AdminMatchDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, referees] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: {
        players: { include: { user: { include: { ratings: true } } }, orderBy: [{ team: "asc" }, { slot: "asc" }] },
        referee: true,
        createdBy: true,
        events: { include: { actor: true }, orderBy: { createdAt: "desc" } },
        disputes: { include: { creator: true }, orderBy: { createdAt: "desc" } },
        payments: { include: { user: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({ where: { isReferee: true, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  if (!match) notFound();

  return (
    <>
      <AdminPageHeader
        title={match.title}
        description={`${match.code} · ${formatLocation(match)}`}
        actions={<Link href="/admin/matches" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">返回比赛列表</Link>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <AdminPanel className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-5">
              <div className="flex flex-wrap gap-2">
                <AdminBadge tone={match.mode === "RANKED" ? "violet" : "gray"}>{MATCH_MODE_LABEL[match.mode]} · {MATCH_TYPE_LABEL[match.type]}</AdminBadge>
                <AdminBadge tone={badgeTone(match.status)}>{STATUS_META[match.status]?.label}</AdminBadge>
                {match.disputes.length ? <AdminBadge tone="red">存在申诉</AdminBadge> : null}
              </div>
              <div className="text-4xl font-black tracking-tight text-white">{match.teamAScore}<span className="mx-3 text-slate-700">:</span>{match.teamBScore}</div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="创建者">{match.createdBy?.name ?? "系统"}</DetailItem>
              <DetailItem label="比赛时间">{adminDate(match.scheduledAt)}</DetailItem>
              <DetailItem label="裁判">{match.referee?.name ?? "未分配"}</DetailItem>
              <DetailItem label="费用">{formatMoney(match.buyInCents)}</DetailItem>
              <DetailItem label="结果确认">{match.resultConfirmedA ? "A 队已确认" : "A 队未确认"} / {match.resultConfirmedB ? "B 队已确认" : "B 队未确认"}</DetailItem>
              <DetailItem label="胜方">{match.winnerTeam ? `${match.winnerTeam} 队` : "未确定"}</DetailItem>
              <DetailItem label="支付状态">{PAYMENT_STATUS_LABEL[match.paymentStatus]}</DetailItem>
              <DetailItem label="直播链接">{match.livestreamUrl ? <a href={match.livestreamUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300">打开直播 <ExternalLink className="h-3 w-3" /></a> : "未上传"}</DetailItem>
            </div>
            {match.adminNote ? <div className="mt-5 rounded-lg border border-orange-400/15 bg-orange-400/6 p-4 text-sm leading-6 text-orange-100">管理员备注：{match.adminNote}</div> : null}
          </AdminPanel>

          <AdminPanel>
            <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">参赛球员</h2></div>
            <AdminTable>
              <AdminTableHead><th className="px-5 py-3">队伍</th><th className="px-4 py-3">球员</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">签到</th><th className="px-4 py-3">支付</th><th className="px-5 py-3 text-right">资料</th></AdminTableHead>
              <tbody className="divide-y divide-white/6">
                {match.players.map((player) => (
                  <tr key={player.id} className="text-sm">
                    <td className="px-5 py-4 font-black text-white">{player.team} 队 · {player.slot}</td>
                    <td className="px-4 py-4"><div className="font-bold text-slate-200">{player.user.name}</div><div className="text-xs text-slate-600">@{player.user.handle}</div></td>
                    <td className="px-4 py-4 font-bold text-slate-300">{player.user.ratings.find((item) => item.mode === match.type)?.rating ?? "—"}</td>
                    <td className="px-4 py-4"><AdminBadge tone={player.checkedIn ? "green" : "gray"}>{player.checkedIn ? "已签到" : "未签到"}</AdminBadge></td>
                    <td className="px-4 py-4"><AdminBadge tone={player.paid ? "green" : "orange"}>{player.paid ? "已支付" : "未支付"}</AdminBadge></td>
                    <td className="px-5 py-4 text-right"><Link href={`/admin/users/${player.userId}`} className="font-bold text-orange-300">查看</Link></td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4"><Radio className="h-4 w-4 text-cyan-300" /><h2 className="font-black text-white">裁判事件日志</h2></div>
            <div className="divide-y divide-white/6 px-5">
              {match.events.map((event) => (
                <div key={event.id} className="grid gap-2 py-4 sm:grid-cols-[150px_130px_1fr]">
                  <span className="text-xs text-slate-600">{adminDate(event.createdAt)}</span>
                  <span className="text-sm font-bold text-slate-300">{EVENT_LABEL[event.type] ?? event.type}{event.team ? ` · ${event.team} 队` : ""}{event.points ? ` +${event.points}` : ""}</span>
                  <span className="text-sm text-slate-500">{event.note ?? "—"} <span className="text-xs text-slate-700">{event.actor?.name ? `· ${event.actor.name}` : ""}</span></span>
                </div>
              ))}
              {!match.events.length ? <div className="py-10 text-center text-sm text-slate-600">暂无事件日志</div> : null}
            </div>
          </AdminPanel>

          {match.disputes.length ? (
            <AdminPanel>
              <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">相关申诉</h2></div>
              <div className="divide-y divide-white/6 px-5">
                {match.disputes.map((dispute) => (
                  <Link key={dispute.id} href={`/admin/disputes/${dispute.id}`} className="flex items-start justify-between gap-4 py-4">
                    <span><span className="block text-sm font-bold text-slate-200">{dispute.creator.name}</span><span className="mt-1 block text-sm text-slate-500">{dispute.reason}</span></span>
                    <AdminBadge tone={badgeTone(dispute.status)}>{DISPUTE_STATUS_LABEL[dispute.status]}</AdminBadge>
                  </Link>
                ))}
              </div>
            </AdminPanel>
          ) : null}
        </div>

        <aside className="space-y-5">
          <AdminPanel className="p-5">
            <h2 className="font-black text-white">修改异常比分</h2>
            <AdminActionForm action="UPDATE_MATCH_SCORE" payload={{ matchId: match.id }} submitLabel="保存比分" confirm="确认修改比赛比分？此操作会写入管理日志。" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-500">A 队<input className={`${inputClass} mt-2`} name="teamAScore" type="number" min="0" defaultValue={match.teamAScore} required /></label>
                <label className="text-xs font-bold text-slate-500">B 队<input className={`${inputClass} mt-2`} name="teamBScore" type="number" min="0" defaultValue={match.teamBScore} required /></label>
              </div>
              <textarea className={`${textareaClass} mt-3`} name="note" required placeholder="填写修改原因" />
            </AdminActionForm>
          </AdminPanel>

          <AdminPanel className="p-5">
            <h2 className="font-black text-white">重新分配裁判</h2>
            <AdminActionForm action="ASSIGN_REFEREE" payload={{ matchId: match.id }} submitLabel="保存裁判分配" confirm="确认修改裁判分配？" className="mt-4">
              <select className={inputClass} name="refereeId" defaultValue={match.refereeId ?? ""}>
                <option value="">不分配裁判</option>
                {referees.map((referee) => <option key={referee.id} value={referee.id}>{referee.name} · {referee.city ?? "未知城市"}</option>)}
              </select>
              <textarea className={`${textareaClass} mt-3`} name="note" placeholder="分配备注（可选）" />
            </AdminActionForm>
          </AdminPanel>

          <AdminPanel className="p-5">
            <h2 className="font-black text-white">管理员备注</h2>
            <AdminActionForm action="UPDATE_MATCH_NOTE" payload={{ matchId: match.id }} submitLabel="保存备注" className="mt-4">
              <textarea className={textareaClass} name="note" defaultValue={match.adminNote ?? ""} placeholder="记录异常情况或处理背景" />
            </AdminActionForm>
          </AdminPanel>

          <AdminPanel className="border-red-400/15 p-5">
            <h2 className="font-black text-red-100">危险操作</h2>
            <AdminActionForm action="UPDATE_MATCH_STATUS" payload={{ matchId: match.id, status: "CANCELLED" }} submitLabel="取消比赛" tone="danger" confirm={`确认取消比赛“${match.title}”？`} className="mt-4">
              <textarea className={textareaClass} name="note" required placeholder="填写取消原因" />
            </AdminActionForm>
            <div className="my-5 border-t border-white/8" />
            <AdminActionForm action="UPDATE_MATCH_STATUS" payload={{ matchId: match.id, status: "INVALID" }} submitLabel="标记比赛无效" tone="danger" confirm={`确认将“${match.title}”标记为无效？`} >
              <textarea className={textareaClass} name="note" required placeholder="填写判无效原因" />
            </AdminActionForm>
          </AdminPanel>
        </aside>
      </div>
    </>
  );
}
