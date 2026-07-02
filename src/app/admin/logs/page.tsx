import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableHead,
} from "@/components/admin/AdminUI";
import { adminDate, ADMIN_ACTION_LABEL } from "@/lib/admin-domain";
import { prisma } from "@/lib/prisma";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const logs = await prisma.adminLog.findMany({
    where: action ? { action } : {},
    include: { admin: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <>
      <AdminPageHeader title="管理日志" description="记录管理员关键操作，便于追溯封禁、审批、改判、申诉和支付处理。" />
      <AdminPanel className="mb-5 p-4">
        <form className="flex flex-wrap gap-3">
          <select name="action" defaultValue={action ?? ""} className="h-11 min-w-64 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300">
            <option value="">全部操作类型</option>
            {Object.entries(ADMIN_ACTION_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <button className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-black text-black">筛选</button>
        </form>
      </AdminPanel>
      <AdminPanel>
        {logs.length ? (
          <AdminTable>
            <AdminTableHead>
              <th className="px-5 py-3">时间</th><th className="px-4 py-3">管理员</th><th className="px-4 py-3">操作</th><th className="px-4 py-3">目标类型</th><th className="px-4 py-3">目标 ID</th><th className="px-5 py-3">备注</th>
            </AdminTableHead>
            <tbody className="divide-y divide-white/6">
              {logs.map((log) => (
                <tr key={log.id} className="text-sm">
                  <td className="px-5 py-4 text-slate-500">{adminDate(log.createdAt)}</td>
                  <td className="px-4 py-4"><div className="font-bold text-slate-200">{log.admin.name}</div><div className="mt-1 text-xs text-slate-600">@{log.admin.handle}</div></td>
                  <td className="px-4 py-4"><AdminBadge tone="orange">{ADMIN_ACTION_LABEL[log.action] ?? log.action}</AdminBadge></td>
                  <td className="px-4 py-4 text-slate-400">{log.targetType}</td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-600">{log.targetId}</td>
                  <td className="max-w-xl px-5 py-4 text-slate-400">{log.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : <AdminEmpty>暂无管理日志。</AdminEmpty>}
      </AdminPanel>
    </>
  );
}
