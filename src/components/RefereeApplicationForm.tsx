"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

const inputClass = "min-h-11 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-300/50";
const textareaClass = "min-h-28 w-full rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-300/50";

export function RefereeApplicationForm({
  defaults,
}: {
  defaults: { realName: string; phone: string; city: string };
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/referee-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "提交失败");
        return;
      }
      window.location.reload();
    });
  }

  return (
    <form action={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-black text-slate-300">真实姓名<input className={`${inputClass} mt-2`} name="realName" defaultValue={defaults.realName} required /></label>
        <label className="text-sm font-black text-slate-300">手机号<input className={`${inputClass} mt-2`} name="phone" defaultValue={defaults.phone} required /></label>
        <label className="text-sm font-black text-slate-300">所在城市<input className={`${inputClass} mt-2`} name="city" defaultValue={defaults.city} required /></label>
        <label className="text-sm font-black text-slate-300">可执裁时间<input className={`${inputClass} mt-2`} name="availableTimes" required placeholder="例如：工作日晚间、周末全天" /></label>
      </div>
      <label className="text-sm font-black text-slate-300">篮球经验<textarea className={`${textareaClass} mt-2`} name="basketballExperience" required placeholder="说明打球年限、球队或赛事经历" /></label>
      <label className="text-sm font-black text-slate-300">裁判经验<textarea className={`${textareaClass} mt-2`} name="refereeExperience" required placeholder="说明执裁场次、比赛级别或相关培训" /></label>
      <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-bold text-slate-300">
        <input type="checkbox" name="hasCertificate" value="true" className="h-4 w-4 accent-orange-500" />
        我持有篮球裁判证
      </label>
      <label className="text-sm font-black text-slate-300">证书图片地址（可选）<input className={`${inputClass} mt-2`} name="certificateUrl" type="url" placeholder="https://..." /></label>
      <label className="text-sm font-black text-slate-300">自我介绍<textarea className={`${textareaClass} mt-2`} name="introduction" required placeholder="介绍你对规则、公平执裁和远程判罚的理解" /></label>
      {message ? <div className="rounded-lg border border-red-400/25 bg-red-400/8 p-3 text-sm font-bold text-red-200">{message}</div> : null}
      <button disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-black text-black hover:bg-orange-400 disabled:opacity-55">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        提交裁判申请
      </button>
    </form>
  );
}
