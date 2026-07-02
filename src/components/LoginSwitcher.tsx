"use client";

import { useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/domain";

type Account = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  status: string;
  isAdmin: boolean;
  isReferee: boolean;
  ratings: Array<{ mode: string; rating: number }>;
};

export function LoginSwitcher({ accounts }: { accounts: Account[] }) {
  const [isPending, startTransition] = useTransition();

  function select(account: Account) {
    startTransition(async () => {
      const response = await fetch("/api/auth/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.id }),
      });
      if (!response.ok) {
        alert("切换账号失败");
        return;
      }
      if (account.isAdmin) window.location.href = "/admin";
      else if (account.isReferee) window.location.href = "/referee";
      else window.location.href = "/";
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => {
        const rating = account.ratings.find((item) => item.mode === "ONE_V_ONE")?.rating;
        return (
          <button
            key={account.id}
            disabled={isPending || account.status !== "ACTIVE"}
            onClick={() => select(account)}
            className="rounded-lg border border-white/10 bg-white/[0.055] p-4 text-left transition hover:border-orange-300/40 hover:bg-white/[0.08]"
          >
            <div className="mb-4 flex items-center gap-3">
              <Avatar label={account.avatar} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-lg font-black text-white">{account.name}</div>
                <div className="truncate text-sm font-bold text-slate-500">{account.handle}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-black text-slate-300">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                {ROLE_LABEL[account.role] ?? account.role}
              </span>
              <span className="text-sm font-black text-orange-200">{account.status === "ACTIVE" ? rating ?? "测试" : "不可登录"}</span>
            </div>
          </button>
        );
      })}
      <Button tone="dark" className="min-h-20" onClick={() => (window.location.href = "/")}>
        继续使用默认球员
      </Button>
    </div>
  );
}
