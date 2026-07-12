"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MapPin, Trophy, UsersRound } from "lucide-react";
import { Button } from "@/components/ui";
import { TIME_SLOT_META } from "@/lib/domain";

type FormState = {
  title: string;
  court: string;
  mode: "CASUAL" | "RANKED";
  type: "ONE_V_ONE" | "THREE_V_THREE";
  scheduledAt: string;
  livestreamUrl: string;
};

export function CreateMatchForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({
    title: "今晚开一局",
    court: "五棵松 3 号场",
    mode: "CASUAL",
    type: "ONE_V_ONE",
    scheduledAt: "",
    livestreamUrl: "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    if (!form.scheduledAt) {
      alert("请先选择具体开赛时间");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (data.id) {
        router.push(`/player/matches/${data.id}`);
      } else {
        alert(data.error ?? "创建失败");
      }
    });
  }

  return (
    <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4">
      <label className="grid gap-2 text-sm font-black text-slate-300">
        房间名
        <input
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          className="h-12 rounded-lg border border-white/10 bg-black/30 px-3 text-base font-bold text-white outline-none focus:border-orange-300/60"
        />
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-300">
        球场
        <span className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-300" />
          <input
            value={form.court}
            onChange={(event) => update("court", event.target.value)}
            className="h-12 w-full rounded-lg border border-white/10 bg-black/30 pl-9 pr-3 text-base font-bold text-white outline-none focus:border-orange-300/60"
          />
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-slate-300">
          模式
          <span className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-black/28 p-1">
            {(["CASUAL", "RANKED"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => update("mode", mode)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-black ${
                  form.mode === mode ? "bg-orange-500 text-black" : "text-slate-400"
                }`}
              >
                {mode === "RANKED" ? <Trophy className="h-4 w-4" /> : <UsersRound className="h-4 w-4" />}
                {mode === "RANKED" ? "排位" : "匹配"}
              </button>
            ))}
          </span>
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-300">
          赛制
          <span className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-black/28 p-1">
            {(["ONE_V_ONE", "THREE_V_THREE"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update("type", type)}
                className={`h-10 rounded-md text-sm font-black ${
                  form.type === type ? "bg-cyan-400 text-black" : "text-slate-400"
                }`}
              >
                {type === "ONE_V_ONE" ? "1V1" : "3V3"}
              </button>
            ))}
          </span>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-black text-slate-300">
        开赛时间
        <span className="relative">
          <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
          type="datetime-local"
          required
            value={form.scheduledAt}
            onChange={(event) => update("scheduledAt", event.target.value)}
            className="h-12 w-full rounded-lg border border-white/10 bg-black/30 pl-9 pr-3 text-base font-bold text-white outline-none focus:border-orange-300/60"
          />
        </span>
        <span className="text-xs font-bold leading-5 text-slate-500">
          {Object.values(TIME_SLOT_META).map((slot) => `${slot.label} ${slot.range}`).join(" · ")}
        </span>
      </label>
      <label className="grid gap-2 text-sm font-black text-slate-300">
        直播链接
        <input
          value={form.livestreamUrl}
          onChange={(event) => update("livestreamUrl", event.target.value)}
          placeholder="https://..."
          className="h-12 rounded-lg border border-white/10 bg-black/30 px-3 text-base font-bold text-white outline-none placeholder:text-slate-600 focus:border-orange-300/60"
        />
      </label>
      <Button onClick={submit} disabled={isPending} tone="orange" className="h-13 text-base">
        创建房间
      </Button>
    </div>
  );
}
