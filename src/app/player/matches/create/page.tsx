import { AppShell } from "@/components/AppShell";
import { CreateMatchForm } from "@/components/CreateMatchForm";
import { Panel, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function CreateMatchPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user} active="比赛">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <h1 className="text-3xl font-black text-white">创建比赛房间</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">先选匹配/排位，再选 1V1/3V3。5V5 留到后续版本。</p>
        </div>
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <Pill tone="green">房主自动加入 A 队</Pill>
            <Pill tone="gold">排位赛结算 Rating</Pill>
            <Pill tone="blue">外部直播链接</Pill>
          </div>
          <CreateMatchForm />
        </Panel>
      </div>
    </AppShell>
  );
}
