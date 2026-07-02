"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CircleStop, MinusCircle, Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";

type ActionPayload = {
  action: "PRE_CHECK" | "START" | "SCORE" | "FOUL" | "UNDO" | "PAUSE" | "RESUME" | "END" | "CONFIRM" | "INVALID";
  team?: "A" | "B";
  points?: number;
  note?: string;
};

export function RefereeConsole({ matchId, status }: { matchId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function send(payload: ActionPayload) {
    if (payload.action === "END" && !window.confirm("确认结束比赛并锁定当前比分？")) return;
    if (payload.action === "CONFIRM" && !window.confirm("确认结算排位分？")) return;
    if (payload.action === "INVALID" && !window.confirm("确认判定为无效赛？")) return;

    startTransition(async () => {
      const response = await fetch(`/api/referee/matches/${matchId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        alert(data.error ?? "操作失败");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button tone="blue" disabled={isPending} onClick={() => send({ action: "PRE_CHECK", note: "赛前检查通过" })}>
          <ShieldCheck className="h-4 w-4" />
          赛前检查
        </Button>
        <Button tone="orange" disabled={isPending || status === "LIVE"} onClick={() => send({ action: "START", note: "比赛开始" })}>
          <Play className="h-4 w-4" />
          开始
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["A", "B"] as const).map((team) => (
          <div key={team} className="rounded-lg border border-white/10 bg-black/28 p-3">
            <div className="mb-3 text-center text-sm font-black text-slate-400">TEAM {team}</div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((points) => (
                <Button
                  key={points}
                  tone={team === "A" ? "orange" : "blue"}
                  disabled={isPending || !["LIVE", "PAUSED"].includes(status)}
                  onClick={() => send({ action: "SCORE", team, points, note: `Team ${team} +${points}` })}
                  className="h-16 text-xl"
                >
                  +{points}
                </Button>
              ))}
            </div>
            <Button
              tone="dark"
              disabled={isPending}
              onClick={() => send({ action: "FOUL", team, note: `Team ${team} 犯规` })}
              className="mt-2 w-full"
            >
              犯规
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button tone="ghost" disabled={isPending} onClick={() => send({ action: "UNDO", note: "撤回上一条计分" })}>
          <RotateCcw className="h-4 w-4" />
          撤回
        </Button>
        <Button tone="ghost" disabled={isPending || status === "PAUSED"} onClick={() => send({ action: "PAUSE", note: "比赛暂停" })}>
          <Pause className="h-4 w-4" />
          暂停
        </Button>
        <Button tone="ghost" disabled={isPending || status !== "PAUSED"} onClick={() => send({ action: "RESUME", note: "比赛继续" })}>
          <Play className="h-4 w-4" />
          继续
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button tone="danger" disabled={isPending} onClick={() => send({ action: "END", note: "比赛结束" })}>
          <CircleStop className="h-4 w-4" />
          结束
        </Button>
        <Button tone="orange" disabled={isPending || status !== "FINISHED"} onClick={() => send({ action: "CONFIRM", note: "确认结果并结算" })}>
          <ShieldCheck className="h-4 w-4" />
          确认
        </Button>
        <Button tone="danger" disabled={isPending} onClick={() => send({ action: "INVALID", note: "判定为无效赛" })}>
          <AlertTriangle className="h-4 w-4" />
          无效
        </Button>
      </div>

      <Button tone="dark" disabled={isPending} onClick={() => send({ action: "UNDO", note: "撤回上一条计分" })}>
        <MinusCircle className="h-4 w-4" />
        快速撤回上一分
      </Button>
    </div>
  );
}
