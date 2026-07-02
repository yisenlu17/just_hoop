"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Radio, UserPlus } from "lucide-react";
import { Button } from "@/components/ui";

export function MatchRoomActions({
  matchId,
  canJoin,
  livestreamUrl,
}: {
  matchId: string;
  canJoin: boolean;
  livestreamUrl?: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(livestreamUrl ?? "");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  async function post(path: string, body?: Record<string, unknown>) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      alert(data.error ?? "操作失败");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          disabled={!canJoin || isPending}
          tone="orange"
          onClick={() => startTransition(() => post(`/api/matches/${matchId}/join`))}
        >
          <UserPlus className="h-4 w-4" />
          加入房间
        </Button>
        <Button
          disabled={isPending}
          tone="blue"
          onClick={() => startTransition(() => post(`/api/matches/${matchId}/check-in`))}
        >
          <CheckCircle2 className="h-4 w-4" />
          签到
        </Button>
      </div>
      <div className="grid gap-2 rounded-lg border border-white/10 bg-black/24 p-3">
        <label className="text-xs font-black text-slate-400">直播链接</label>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/60"
          />
          <Button
            disabled={isPending}
            tone="ghost"
            className="min-h-10"
            onClick={() => startTransition(() => post(`/api/matches/${matchId}/stream`, { livestreamUrl: url }))}
          >
            <Radio className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-2 rounded-lg border border-red-400/20 bg-red-500/8 p-3">
        <label className="text-xs font-black text-red-200">争议复核</label>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          placeholder="描述需要复核的回合"
          className="resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-red-300/60"
        />
        <Button
          disabled={isPending || reason.length < 4}
          tone="danger"
          onClick={() => startTransition(() => post(`/api/matches/${matchId}/dispute`, { reason }))}
        >
          <AlertTriangle className="h-4 w-4" />
          提交争议
        </Button>
      </div>
    </div>
  );
}
