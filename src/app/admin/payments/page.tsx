import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
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
  PAYMENT_STATUS_LABEL,
} from "@/lib/admin-domain";
import { formatMoney } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const filters = await searchParams;
  const where: Prisma.PaymentWhereInput = {};
  if (["UNPAID", "PENDING", "MANUAL_REVIEW", "PAID", "REFUNDED"].includes(filters.status ?? "")) {
    where.status = filters.status as "UNPAID" | "PENDING" | "MANUAL_REVIEW" | "PAID" | "REFUNDED";
  }
  if (filters.q) {
    where.OR = [
      { user: { name: { contains: filters.q, mode: "insensitive" } } },
      { user: { phone: { contains: filters.q } } },
      { match: { title: { contains: filters.q, mode: "insensitive" } } },
      { match: { code: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  const payments = await prisma.payment.findMany({
    where,
    include: { user: true, match: true, reviewedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminPageHeader title="支付管理" description="第一版使用支付状态和截图审核；可人工确认到账或标记退款。" />
      <AdminPanel className="mb-5 p-4">
        <form className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_200px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input name="q" defaultValue={filters.q} placeholder="搜索用户、手机号、比赛" className="h-11 w-full rounded-lg border border-white/10 bg-[#080b11] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-700" />
          </label>
          <select name="status" defaultValue={filters.status ?? ""} className="h-11 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300">
            <option value="">全部支付状态</option><option value="PENDING">待支付</option><option value="MANUAL_REVIEW">人工确认</option><option value="PAID">已支付</option><option value="REFUNDED">退款</option>
          </select>
          <button className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-black text-black">筛选</button>
        </form>
      </AdminPanel>
      <AdminPanel>
        {payments.length ? (
          <AdminTable>
            <AdminTableHead>
              <th className="px-5 py-3">订单</th><th className="px-4 py-3">用户</th><th className="px-4 py-3">比赛</th><th className="px-4 py-3">金额</th><th className="px-4 py-3">凭证</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">创建时间</th><th className="px-5 py-3 text-right">操作</th>
            </AdminTableHead>
            <tbody className="divide-y divide-white/6">
              {payments.map((payment) => (
                <tr key={payment.id} className="text-sm hover:bg-white/[0.018]">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{payment.id.slice(-10)}</td>
                  <td className="px-4 py-4"><div className="font-bold text-slate-200">{payment.user.name}</div><div className="mt-1 text-xs text-slate-600">{payment.user.phone}</div></td>
                  <td className="px-4 py-4"><div className="font-bold text-slate-300">{payment.match.title}</div><div className="mt-1 text-xs text-slate-600">{payment.match.code}</div></td>
                  <td className="px-4 py-4 font-black text-white">{formatMoney(payment.amount)}</td>
                  <td className="px-4 py-4"><AdminBadge tone={payment.screenshotUrl ? "cyan" : "gray"}>{payment.screenshotUrl ? "已上传" : "无截图"}</AdminBadge></td>
                  <td className="px-4 py-4"><AdminBadge tone={badgeTone(payment.status)}>{PAYMENT_STATUS_LABEL[payment.status]}</AdminBadge></td>
                  <td className="px-4 py-4 text-slate-500">{adminDate(payment.createdAt)}</td>
                  <td className="px-5 py-4 text-right"><Link href={`/admin/payments/${payment.id}`} className="font-bold text-orange-300">审核订单</Link></td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : <AdminEmpty>没有符合条件的支付订单。</AdminEmpty>}
      </AdminPanel>
    </>
  );
}
