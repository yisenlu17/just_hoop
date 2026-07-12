import { AppShell } from "@/components/AppShell";
import { RefereeApplicationForm } from "@/components/RefereeApplicationForm";
import { Panel, Pill } from "@/components/ui";
import { requirePageUser } from "@/lib/auth";
import { adminDate, REFEREE_APPLICATION_STATUS_LABEL } from "@/lib/admin-domain";
import { prisma } from "@/lib/prisma";

export default async function RefereeApplicationPage() {
  const user = await requirePageUser();
  const latest = await prisma.refereeApplication.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={user} active="">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <h1 className="text-3xl font-black text-white">申请成为裁判</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">提交经历和可执裁时间，管理员审核通过后即可进入裁判工作台。</p>
        </div>
        {user.isReferee ? (
          <Panel className="p-6 text-center">
            <Pill tone="green">裁判权限已开通</Pill>
            <p className="mt-4 text-sm font-bold text-slate-400">你的账号已通过裁判资格审核，可以直接进入裁判端。</p>
          </Panel>
        ) : latest?.status === "PENDING" ? (
          <Panel className="p-6">
            <Pill tone="orange">{REFEREE_APPLICATION_STATUS_LABEL[latest.status]}</Pill>
            <h2 className="mt-4 text-xl font-black text-white">申请正在审核中</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">提交时间：{adminDate(latest.createdAt)}。管理员完成审核后，状态会在这里更新。</p>
          </Panel>
        ) : (
          <Panel className="p-5 sm:p-6">
            {latest?.status === "REJECTED" ? (
              <div className="mb-5 rounded-lg border border-red-400/20 bg-red-400/7 p-4">
                <div className="font-black text-red-200">上次申请未通过</div>
                <p className="mt-1 text-sm leading-6 text-red-200/70">{latest.adminNote ?? "请完善资料后重新提交。"}</p>
              </div>
            ) : null}
            <RefereeApplicationForm defaults={{ realName: user.name, phone: user.phone, city: user.city ?? "" }} />
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
