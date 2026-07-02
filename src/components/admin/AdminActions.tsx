"use client";

import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useState,
  useTransition,
} from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/components/ui";

type Tone = "primary" | "danger" | "neutral" | "success";

const toneClasses: Record<Tone, string> = {
  primary: "border-orange-400/40 bg-orange-500 text-[#17130f] hover:bg-orange-400",
  danger: "border-red-400/35 bg-red-500/12 text-red-200 hover:bg-red-500/20",
  neutral: "border-white/10 bg-white/5 text-slate-200 hover:bg-white/9",
  success: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200 hover:bg-emerald-500/20",
};

async function mutate(body: Record<string, unknown>) {
  const response = await fetch("/api/admin/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "操作失败");
}

export function AdminActionButton({
  action,
  payload,
  confirm,
  children,
  tone = "neutral",
  className,
}: {
  action: string;
  payload: Record<string, unknown>;
  confirm?: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      try {
        await mutate({ action, ...payload });
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "操作失败");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={run}
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition disabled:cursor-wait disabled:opacity-55",
        toneClasses[tone],
        className,
      )}
    >
      {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function AdminActionForm({
  action,
  payload,
  confirm,
  submitLabel,
  children,
  tone = "primary",
  className,
}: {
  action: string;
  payload: Record<string, unknown>;
  confirm?: string;
  submitLabel: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const form = event.currentTarget;
    setPending(true);
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await mutate({ action, ...payload, ...data });
      form.reset();
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "操作失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className={className}>
      {children}
      <button
        disabled={pending}
        className={cn(
          "mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:cursor-wait disabled:opacity-55",
          toneClasses[tone],
        )}
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </button>
    </form>
  );
}
