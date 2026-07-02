import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/AdminActions";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  DetailItem,
} from "@/components/admin/AdminUI";
import {
  adminDate,
  badgeTone,
  DISPUTE_STATUS_LABEL,
} from "@/lib/admin-domain";
import { EVENT_LABEL, STATUS_META } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const inputClass = "h-10 w-full rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-white outline-none focus:border-orange-400/45";
const textareaClass = "min-h-24 w-full rounded-lg border border-white/10 bg-[#080b11] p-3 text-sm text-white outline-none focus:border-orange-400/45";

export default async function AdminDisputeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      creator: true,
      resolvedBy: true,
      match: {
        include: {
          referee: true,
          players: { include: { user: true }, orderBy: [{ team: "asc" }, { slot: "asc" }] },
          events: { include: { actor: true }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!dispute) notFound();

  return (
    <>
      <AdminPageHeader
        title="申诉详情"
        description={`${dispute.match.title} · ${dispute.match.code}`}
        actions={<Link href="/admin/disputes" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">返回申诉列表</Link>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <AdminPanel className="p-5">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/8 pb-5">
              <div>
                <div className="text-lg font-black text-white">{dispute.creator.name}</div>
                <Link href={`/admin/users/${dispute.creator.id}`} className="mt-1 block text-sm text-orange-300">{dispute.creator.phone} · 查看用户资料</Link>
              </div>
              <AdminBadge tone={badgeTone(dispute.status)}>{DISPUTE_STATUS_LABEL[dispute.status]}</AdminBadge>
            </div>
            <DetailItem label="申诉原因"><p className="whitespace-pre-wrap leading-7">{dispute.reason}</p></DetailItem>
            <div className="mt-5 grid gap-5 border-t border-white/8 pt-5 sm:grid-cols-3">
              <DetailItem label="提交时间">{adminDate(dispute.createdAt)}</DetailItem>
              <DetailItem label="处理人">{dispute.resolvedBy?.name}</DetailItem>
              <DetailItem label="处理时间">{adminDate(dispute.resolvedAt)}</DetailItem>
            </div>
            {dispute.adminNote ? <div className="mt-5 rounded-lg border border-orange-400/15 bg-orange-400/6 p-4 text-sm leading-6 text-orange-100">处理备注：{dispute.adminNote}</div> : null}
          </AdminPanel>

          <AdminPanel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex gap-2"><AdminBadge tone={badgeTone(dispute.match.status)}>{STATUS_META[dispute.match.status]?.label}</AdminBadge><AdminBadge>{dispute.match.referee?.name ?? "未分配裁判"}</AdminBadge></div>
                <h2 className="mt-3 text-xl font-black text-white">{dispute.match.title}</h2>
              </div>
              <div className="text-4xl font-black text-white">{dispute.match.teamAScore}<span className="mx-3 text-slate-700">:</span>{dispute.match.teamBScore}</div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {dispute.match.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded-lg border border-white/8 bg-[#080b11] px-4 py-3">
                  <span className="text-sm font-bold text-slate-200">{player.team} 队 · {player.user.name}</span>
                  <Link href={`/admin/users/${player.userId}`} className="text-xs font-bold text-orange-300">资料</Link>
                </div>
              ))}
            </div>
            <Link href={`/admin/matches/${dispute.match.id}`} className="mt-4 inline-flex text-sm font-bold text-orange-300">查看完整比赛详情 →</Link>
          </AdminPanel>

          <AdminPanel>
            <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">裁判记录</h2></div>
            <div className="divide-y divide-white/6 px-5">
              {dispute.match.events.map((event) => (
                <div key={event.id} className="grid gap-2 py-4 sm:grid-cols-[150px_130px_1fr]">
                  <span className="text-xs text-slate-600">{adminDate(event.createdAt)}</span>
                  <span className="text-sm font-bold text-slate-300">{EVENT_LABEL[event.type] ?? event.type}</span>
                  <span className="text-sm text-slate-500">{event.note ?? "—"} {event.actor?.name ? `· ${event.actor.name}` : ""}</span>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <aside className="space-y-5">
          {dispute.status === "OPEN" ? (
            <AdminPanel className="p-5">
              <h2 className="font-black text-white">接受申诉</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">先标记为处理中，调查完成后再给出最终结论。</p>
              <AdminActionForm action="RESOLVE_DISPUTE" payload={{ disputeId: dispute.id, status: "REVIEWING", matchAction: "KEEP" }} submitLabel="开始处理" confirm="确认接受并开始处理该申诉？" className="mt-4">
                <textarea className={textareaClass} name="note" required placeholder="记录初步处理意见" />
              </AdminActionForm>
            </AdminPanel>
          ) : null}

          {["OPEN", "REVIEWING"].includes(dispute.status) ? (
            <>
              <AdminPanel className="p-5">
                <h2 className="font-black text-white">解决申诉 · 保持结果</h2>
                <AdminActionForm action="RESOLVE_DISPUTE" payload={{ disputeId: dispute.id, status: "RESOLVED", matchAction: "KEEP" }} submitLabel="确认解决" tone="success" confirm="确认解决申诉并保持原比赛结果？" className="mt-4">
                  <textarea className={textareaClass} name="note" required placeholder="填写最终处理说明" />
                </AdminActionForm>
              </AdminPanel>

              <AdminPanel className="p-5">
                <h2 className="font-black text-white">解决申诉 · 修改比分</h2>
                <AdminActionForm action="RESOLVE_DISPUTE" payload={{ disputeId: dispute.id, status: "RESOLVED", matchAction: "UPDATE_SCORE" }} submitLabel="改分并解决" confirm="确认修改比赛结果并解决申诉？" className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-slate-500">A 队<input className={`${inputClass} mt-2`} name="teamAScore" type="number" min="0" defaultValue={dispute.match.teamAScore} required /></label>
                    <label className="text-xs font-bold text-slate-500">B 队<input className={`${inputClass} mt-2`} name="teamBScore" type="number" min="0" defaultValue={dispute.match.teamBScore} required /></label>
                  </div>
                  <textarea className={`${textareaClass} mt-3`} name="note" required placeholder="说明改判依据" />
                </AdminActionForm>
              </AdminPanel>

              <AdminPanel className="border-red-400/15 p-5">
                <h2 className="font-black text-red-100">标记比赛无效</h2>
                <AdminActionForm action="RESOLVE_DISPUTE" payload={{ disputeId: dispute.id, status: "RESOLVED", matchAction: "INVALID" }} submitLabel="判为无效并解决" tone="danger" confirm="确认将相关比赛标记为无效？" className="mt-4">
                  <textarea className={textareaClass} name="note" required placeholder="填写判无效依据" />
                </AdminActionForm>
              </AdminPanel>

              <AdminPanel className="p-5">
                <h2 className="font-black text-white">驳回申诉</h2>
                <AdminActionForm action="RESOLVE_DISPUTE" payload={{ disputeId: dispute.id, status: "REJECTED", matchAction: "KEEP" }} submitLabel="驳回申诉" tone="danger" confirm="确认驳回该申诉？" className="mt-4">
                  <textarea className={textareaClass} name="note" required placeholder="填写驳回理由" />
                </AdminActionForm>
              </AdminPanel>
            </>
          ) : null}
        </aside>
      </div>
    </>
  );
}
