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
  PAYMENT_STATUS_LABEL,
} from "@/lib/admin-domain";
import { formatMoney } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const textareaClass = "min-h-24 w-full rounded-lg border border-white/10 bg-[#080b11] p-3 text-sm text-white outline-none focus:border-orange-400/45";

export default async function AdminPaymentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { user: true, match: true, reviewedBy: true },
  });
  if (!payment) notFound();

  return (
    <>
      <AdminPageHeader
        title="支付订单审核"
        description={`订单 ${payment.id}`}
        actions={<Link href="/admin/payments" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">返回支付列表</Link>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <AdminPanel className="p-5">
            <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-5">
              <div className="text-3xl font-black text-white">{formatMoney(payment.amount)}</div>
              <AdminBadge tone={badgeTone(payment.status)}>{PAYMENT_STATUS_LABEL[payment.status]}</AdminBadge>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="用户"><Link href={`/admin/users/${payment.userId}`} className="text-orange-300">{payment.user.name}</Link></DetailItem>
              <DetailItem label="手机号">{payment.user.phone}</DetailItem>
              <DetailItem label="关联比赛"><Link href={`/admin/matches/${payment.matchId}`} className="text-orange-300">{payment.match.title}</Link></DetailItem>
              <DetailItem label="比赛编号">{payment.match.code}</DetailItem>
              <DetailItem label="订单创建">{adminDate(payment.createdAt)}</DetailItem>
              <DetailItem label="审核人">{payment.reviewedBy?.name}</DetailItem>
              <DetailItem label="审核时间">{adminDate(payment.reviewedAt)}</DetailItem>
              <DetailItem label="审核备注">{payment.adminNote}</DetailItem>
            </div>
          </AdminPanel>
          <AdminPanel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black text-white">支付截图</h2>
              {payment.screenshotUrl ? <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-orange-300">打开原图</a> : null}
            </div>
            {payment.screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={payment.screenshotUrl} alt="支付截图" className="mx-auto max-h-[720px] max-w-full rounded-xl border border-white/8 bg-white object-contain" />
            ) : <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-white/10 text-sm text-slate-600">用户未上传支付截图</div>}
          </AdminPanel>
        </div>
        <aside className="space-y-5">
          <AdminPanel className="p-5">
            <h2 className="font-black text-white">人工确认支付</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">确认截图与金额无误后，将订单标记为已支付。</p>
            <AdminActionForm action="UPDATE_PAYMENT_STATUS" payload={{ paymentId: payment.id, status: "PAID" }} submitLabel="确认已支付" tone="success" confirm="确认该订单已经支付？" className="mt-4">
              <textarea className={textareaClass} name="note" required placeholder="填写确认依据" />
            </AdminActionForm>
          </AdminPanel>
          <AdminPanel className="border-red-400/15 p-5">
            <h2 className="font-black text-red-100">标记退款</h2>
            <AdminActionForm action="UPDATE_PAYMENT_STATUS" payload={{ paymentId: payment.id, status: "REFUNDED" }} submitLabel="标记已退款" tone="danger" confirm="确认将订单标记为已退款？" className="mt-4">
              <textarea className={textareaClass} name="note" required placeholder="填写退款原因和处理说明" />
            </AdminActionForm>
          </AdminPanel>
          <AdminPanel className="p-5">
            <h2 className="font-black text-white">退回人工审核</h2>
            <AdminActionForm action="UPDATE_PAYMENT_STATUS" payload={{ paymentId: payment.id, status: "MANUAL_REVIEW" }} submitLabel="设为人工确认" confirm="确认将订单退回人工确认状态？" className="mt-4">
              <textarea className={textareaClass} name="note" required placeholder="填写需要再次审核的原因" />
            </AdminActionForm>
          </AdminPanel>
        </aside>
      </div>
    </>
  );
}
