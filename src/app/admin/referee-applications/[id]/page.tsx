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
  REFEREE_APPLICATION_STATUS_LABEL,
} from "@/lib/admin-domain";
import { prisma } from "@/lib/prisma";

const textareaClass = "min-h-28 w-full rounded-lg border border-white/10 bg-[#080b11] p-3 text-sm text-white outline-none focus:border-orange-400/45";

export default async function RefereeApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await prisma.refereeApplication.findUnique({
    where: { id },
    include: { user: true, reviewedBy: true },
  });
  if (!application) notFound();

  return (
    <>
      <AdminPageHeader
        title={`裁判申请 · ${application.realName}`}
        description={`申请于 ${adminDate(application.createdAt)}`}
        actions={<Link href="/admin/referee-applications" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">返回申请列表</Link>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <AdminPanel className="p-5">
            <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-5">
              <div>
                <div className="text-lg font-black text-white">{application.user.name} <span className="text-sm font-semibold text-slate-600">@{application.user.handle}</span></div>
                <div className="mt-1 text-sm text-slate-500">{application.phone} · {application.city}</div>
              </div>
              <AdminBadge tone={badgeTone(application.status)}>{REFEREE_APPLICATION_STATUS_LABEL[application.status]}</AdminBadge>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="真实姓名">{application.realName}</DetailItem>
              <DetailItem label="可执裁时间">{application.availableTimes}</DetailItem>
              <DetailItem label="是否有裁判证">{application.hasCertificate ? "是" : "否"}</DetailItem>
              <DetailItem label="当前裁判权限">{application.user.isReferee ? "已开通" : "未开通"}</DetailItem>
            </div>
          </AdminPanel>
          <AdminPanel className="p-5">
            <h2 className="font-black text-white">篮球经验</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">{application.basketballExperience}</p>
            <h2 className="mt-6 border-t border-white/8 pt-5 font-black text-white">裁判经验</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">{application.refereeExperience}</p>
            <h2 className="mt-6 border-t border-white/8 pt-5 font-black text-white">自我介绍</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">{application.introduction}</p>
          </AdminPanel>
          {application.certificateUrl ? (
            <AdminPanel className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-black text-white">裁判证书</h2>
                <a href={application.certificateUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-orange-300">打开原图</a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={application.certificateUrl} alt="裁判证书" className="max-h-[520px] w-full rounded-lg border border-white/8 bg-white object-contain" />
            </AdminPanel>
          ) : null}
        </div>
        <aside className="space-y-5">
          {application.status === "PENDING" ? (
            <>
              <AdminPanel className="p-5">
                <h2 className="font-black text-white">通过申请</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">通过后会立即设置 is_referee，并开放 /referee。</p>
                <AdminActionForm action="REVIEW_REFEREE" payload={{ applicationId: application.id, decision: "APPROVED" }} submitLabel="通过申请" tone="success" confirm={`确认通过 ${application.realName} 的裁判申请？`} className="mt-4">
                  <textarea className={textareaClass} name="note" required placeholder="填写审核备注" />
                </AdminActionForm>
              </AdminPanel>
              <AdminPanel className="p-5">
                <h2 className="font-black text-white">拒绝申请</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">拒绝原因会被保存，用户不会获得裁判端权限。</p>
                <AdminActionForm action="REVIEW_REFEREE" payload={{ applicationId: application.id, decision: "REJECTED" }} submitLabel="拒绝申请" tone="danger" confirm={`确认拒绝 ${application.realName} 的裁判申请？`} className="mt-4">
                  <textarea className={textareaClass} name="note" required placeholder="必须填写拒绝原因" />
                </AdminActionForm>
              </AdminPanel>
            </>
          ) : (
            <AdminPanel className="p-5">
              <h2 className="font-black text-white">审核结果</h2>
              <div className="mt-4 grid gap-4">
                <DetailItem label="审核状态">{REFEREE_APPLICATION_STATUS_LABEL[application.status]}</DetailItem>
                <DetailItem label="审核人">{application.reviewedBy?.name}</DetailItem>
                <DetailItem label="审核时间">{adminDate(application.reviewedAt)}</DetailItem>
                <DetailItem label="审核备注">{application.adminNote}</DetailItem>
              </div>
            </AdminPanel>
          )}
        </aside>
      </div>
    </>
  );
}
