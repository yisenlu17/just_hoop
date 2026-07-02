import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const { area } = await searchParams;
  const isAdmin = area === "admin";
  return (
    <main className="grid min-h-screen place-items-center bg-[#080b11] px-5 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d121b] p-8 text-center shadow-2xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-red-400/25 bg-red-400/8 text-red-300">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-white">无权访问此页面</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isAdmin
            ? "仅已启用的管理员账号可以进入管理后台。"
            : "仅已通过资格审核的裁判可以进入裁判工作台。"}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold">
            返回首页
          </Link>
          <Link href="/login" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black">
            切换账号
          </Link>
        </div>
      </section>
    </main>
  );
}
