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
  REFEREE_APPLICATION_STATUS_LABEL,
} from "@/lib/admin-domain";
import { prisma } from "@/lib/prisma";

export default async function RefereeApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const applications = await prisma.refereeApplication.findMany({
    where: ["PENDING", "APPROVED", "REJECTED"].includes(status ?? "")
      ? { status: status as "PENDING" | "APPROVED" | "REJECTED" }
      : {},
    include: { user: true, reviewedBy: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <AdminPageHeader title="裁判资格审批" description="审核用户提交的裁判经历、证书和可执裁时间；通过后立即开放裁判端权限。" />
      <AdminPanel className="mb-5 p-4">
        <form className="flex flex-wrap gap-3">
          <select name="status" defaultValue={status ?? ""} className="h-11 min-w-48 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300 outline-none">
            <option value="">全部申请状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已拒绝</option>
          </select>
          <button className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-black text-black">筛选</button>
        </form>
      </AdminPanel>
      <AdminPanel>
        {applications.length ? (
          <AdminTable>
            <AdminTableHead>
              <th className="px-5 py-3">申请人</th>
              <th className="px-4 py-3">城市 / 电话</th>
              <th className="px-4 py-3">裁判经验</th>
              <th className="px-4 py-3">证书</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">申请时间</th>
              <th className="px-5 py-3 text-right">操作</th>
            </AdminTableHead>
            <tbody className="divide-y divide-white/6">
              {applications.map((application) => (
                <tr key={application.id} className="text-sm hover:bg-white/[0.018]">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-100">{application.realName}</div>
                    <div className="mt-1 text-xs text-slate-600">{application.user.name} · @{application.user.handle}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{application.city}<div className="mt-1 text-xs text-slate-600">{application.phone}</div></td>
                  <td className="max-w-72 px-4 py-4"><p className="line-clamp-2 text-slate-400">{application.refereeExperience}</p></td>
                  <td className="px-4 py-4"><AdminBadge tone={application.hasCertificate ? "green" : "gray"}>{application.hasCertificate ? "有证书" : "无证书"}</AdminBadge></td>
                  <td className="px-4 py-4"><AdminBadge tone={badgeTone(application.status)}>{REFEREE_APPLICATION_STATUS_LABEL[application.status]}</AdminBadge></td>
                  <td className="px-4 py-4 text-slate-500">{adminDate(application.createdAt)}</td>
                  <td className="px-5 py-4 text-right"><Link href={`/admin/referee-applications/${application.id}`} className="font-bold text-orange-300">查看详情</Link></td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : <AdminEmpty>没有符合条件的裁判申请。</AdminEmpty>}
      </AdminPanel>
    </>
  );
}
