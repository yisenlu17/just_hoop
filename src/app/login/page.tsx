import { AppShell } from "@/components/AppShell";
import { LoginSwitcher } from "@/components/LoginSwitcher";
import { Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getAccounts } from "@/lib/data";

export default async function LoginPage() {
  const [user, accounts] = await Promise.all([getCurrentUser(), getAccounts()]);

  return (
    <AppShell user={user} active="" showBack={false}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <h1 className="text-3xl font-black text-white">测试账号登录</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">MVP 阶段使用测试账号切换球员、裁判和运营身份。</p>
        </div>
        <Panel className="p-4 sm:p-5">
          <LoginSwitcher accounts={accounts} />
        </Panel>
      </div>
    </AppShell>
  );
}
