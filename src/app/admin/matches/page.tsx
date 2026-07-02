import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableHead,
} from "@/components/admin/AdminUI";
import { adminDate, badgeTone } from "@/lib/admin-domain";
import {
  formatLocation,
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  STATUS_META,
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; mode?: string; type?: string }>;
}) {
  const filters = await searchParams;
  const where: Prisma.MatchWhereInput = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { code: { contains: filters.q, mode: "insensitive" } },
      { court: { contains: filters.q, mode: "insensitive" } },
      { gym: { contains: filters.q, mode: "insensitive" } },
      { createdBy: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  if (filters.status && STATUS_META[filters.status]) {
    where.status = filters.status as Prisma.EnumMatchStatusFilter;
  }
  if (["CASUAL", "RANKED"].includes(filters.mode ?? "")) {
    where.mode = filters.mode as "CASUAL" | "RANKED";
  }
  if (["ONE_V_ONE", "THREE_V_THREE"].includes(filters.type ?? "")) {
    where.type = filters.type as "ONE_V_ONE" | "THREE_V_THREE";
  }

  const matches = await prisma.match.findMany({
    where,
    include: {
      referee: true,
      createdBy: true,
      _count: { select: { players: true, disputes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminPageHeader title="比赛管理" description="检索全部匹配和排位比赛，查看详情并处理异常状态、比分和裁判分配。" />
      <AdminPanel className="mb-5 p-4">
        <form className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_170px_150px_150px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input name="q" defaultValue={filters.q} placeholder="搜索名称、地点、创建者" className="h-11 w-full rounded-lg border border-white/10 bg-[#080b11] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-700" />
          </label>
          <select name="status" defaultValue={filters.status ?? ""} className="h-11 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300">
            <option value="">全部状态</option>
            {Object.entries(STATUS_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
          </select>
          <select name="mode" defaultValue={filters.mode ?? ""} className="h-11 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300">
            <option value="">匹配 / 排位</option><option value="CASUAL">匹配</option><option value="RANKED">排位</option>
          </select>
          <select name="type" defaultValue={filters.type ?? ""} className="h-11 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300">
            <option value="">1V1 / 3V3</option><option value="ONE_V_ONE">1V1</option><option value="THREE_V_THREE">3V3</option>
          </select>
          <button className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-black text-black">筛选</button>
        </form>
      </AdminPanel>
      <AdminPanel>
        {matches.length ? (
          <AdminTable>
            <AdminTableHead>
              <th className="px-5 py-3">比赛</th><th className="px-4 py-3">模式</th><th className="px-4 py-3">地点</th><th className="px-4 py-3">比分</th><th className="px-4 py-3">裁判</th><th className="px-4 py-3">球员</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">创建时间</th><th className="px-5 py-3 text-right">操作</th>
            </AdminTableHead>
            <tbody className="divide-y divide-white/6">
              {matches.map((match) => (
                <tr key={match.id} className="text-sm hover:bg-white/[0.018]">
                  <td className="px-5 py-4"><div className="font-bold text-slate-100">{match.title}</div><div className="mt-1 text-xs text-slate-600">{match.code} · {match.createdBy?.name ?? "系统"}</div></td>
                  <td className="px-4 py-4 text-slate-400">{MATCH_MODE_LABEL[match.mode]} · {MATCH_TYPE_LABEL[match.type]}</td>
                  <td className="max-w-56 truncate px-4 py-4 text-slate-400">{formatLocation(match)}</td>
                  <td className="px-4 py-4 font-black text-white">{match.teamAScore}:{match.teamBScore}</td>
                  <td className="px-4 py-4 text-slate-400">{match.referee?.name ?? "未分配"}</td>
                  <td className="px-4 py-4 text-slate-400">{match._count.players}/{match.maxPlayers}</td>
                  <td className="px-4 py-4"><div className="flex items-center gap-2"><AdminBadge tone={badgeTone(match.status)}>{STATUS_META[match.status]?.label}</AdminBadge>{match._count.disputes ? <AdminBadge tone="red">{match._count.disputes} 申诉</AdminBadge> : null}</div></td>
                  <td className="px-4 py-4 text-slate-500">{adminDate(match.createdAt)}</td>
                  <td className="px-5 py-4 text-right"><Link href={`/admin/matches/${match.id}`} className="font-bold text-orange-300">查看详情</Link></td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : <AdminEmpty>没有找到符合条件的比赛。</AdminEmpty>}
      </AdminPanel>
    </>
  );
}
