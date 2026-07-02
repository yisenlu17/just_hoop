import Link from "next/link";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableHead,
} from "@/components/admin/AdminUI";
import {
  adminDate,
  badgeTone,
  DISPUTE_STATUS_LABEL,
} from "@/lib/admin-domain";
import { STATUS_META } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const disputes = await prisma.dispute.findMany({
    where: ["OPEN", "REVIEWING", "RESOLVED", "REJECTED"].includes(status ?? "")
      ? { status: status as "OPEN" | "REVIEWING" | "RESOLVED" | "REJECTED" }
      : {},
    include: { creator: true, match: { include: { referee: true } }, resolvedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminPageHeader title="申诉管理" description="集中查看比赛申诉、裁判记录和处理结果，并在必要时改判比分或标记比赛无效。" />
      <AdminPanel className="mb-5 p-4">
        <form className="flex flex-wrap gap-3">
          <select name="status" defaultValue={status ?? ""} className="h-11 min-w-48 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300">
            <option value="">全部状态</option><option value="OPEN">待处理</option><option value="REVIEWING">处理中</option><option value="RESOLVED">已解决</option><option value="REJECTED">已驳回</option>
          </select>
          <button className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-black text-black">筛选</button>
        </form>
      </AdminPanel>
      <AdminPanel>
        {disputes.length ? (
          <AdminTable>
            <AdminTableHead>
              <th className="px-5 py-3">相关比赛</th><th className="px-4 py-3">申诉人</th><th className="px-4 py-3">申诉原因</th><th className="px-4 py-3">比赛状态</th><th className="px-4 py-3">申诉状态</th><th className="px-4 py-3">提交时间</th><th className="px-5 py-3 text-right">操作</th>
            </AdminTableHead>
            <tbody className="divide-y divide-white/6">
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="text-sm hover:bg-white/[0.018]">
                  <td className="px-5 py-4"><div className="font-bold text-slate-100">{dispute.match.title}</div><div className="mt-1 text-xs text-slate-600">{dispute.match.code} · 裁判 {dispute.match.referee?.name ?? "未分配"}</div></td>
                  <td className="px-4 py-4"><div className="text-slate-300">{dispute.creator.name}</div><div className="mt-1 text-xs text-slate-600">{dispute.creator.phone}</div></td>
                  <td className="max-w-80 px-4 py-4"><p className="line-clamp-2 text-slate-400">{dispute.reason}</p></td>
                  <td className="px-4 py-4"><AdminBadge tone={badgeTone(dispute.match.status)}>{STATUS_META[dispute.match.status]?.label}</AdminBadge></td>
                  <td className="px-4 py-4"><AdminBadge tone={badgeTone(dispute.status)}>{DISPUTE_STATUS_LABEL[dispute.status]}</AdminBadge></td>
                  <td className="px-4 py-4 text-slate-500">{adminDate(dispute.createdAt)}</td>
                  <td className="px-5 py-4 text-right"><Link href={`/admin/disputes/${dispute.id}`} className="font-bold text-orange-300">处理申诉</Link></td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : <AdminEmpty>没有符合条件的申诉。</AdminEmpty>}
      </AdminPanel>
    </>
  );
}
