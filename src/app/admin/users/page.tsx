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
import { badgeTone, USER_STATUS_LABEL } from "@/lib/admin-domain";
import { ROLE_LABEL } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const where: Prisma.UserWhereInput = {};
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { handle: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (["PLAYER", "REFEREE", "ADMIN"].includes(filters.role ?? "")) {
    where.role = filters.role as "PLAYER" | "REFEREE" | "ADMIN";
  }
  if (["ACTIVE", "BANNED", "PENDING_REVIEW"].includes(filters.status ?? "")) {
    where.status = filters.status as "ACTIVE" | "BANNED" | "PENDING_REVIEW";
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      ratings: true,
      _count: { select: { matchPlayers: true, createdMatches: true, disputes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminPageHeader title="用户管理" description="搜索用户、查看球员资料与战绩，并管理账号状态和信用分。" />
      <AdminPanel className="mb-5 p-4">
        <form className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_180px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="搜索昵称 / 手机号 / 邮箱"
              className="h-11 w-full rounded-lg border border-white/10 bg-[#080b11] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-orange-400/45"
            />
          </label>
          <select name="role" defaultValue={filters.role ?? ""} className="h-11 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300 outline-none">
            <option value="">全部角色</option>
            <option value="PLAYER">球员</option>
            <option value="REFEREE">裁判</option>
            <option value="ADMIN">管理员</option>
          </select>
          <select name="status" defaultValue={filters.status ?? ""} className="h-11 rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-slate-300 outline-none">
            <option value="">全部状态</option>
            <option value="ACTIVE">正常</option>
            <option value="BANNED">封禁</option>
            <option value="PENDING_REVIEW">待审核</option>
          </select>
          <button className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-black text-black hover:bg-orange-400">筛选</button>
        </form>
      </AdminPanel>

      <AdminPanel>
        <div className="border-b border-white/8 px-5 py-4 text-sm text-slate-500">共 {users.length} 位用户</div>
        {users.length ? (
          <AdminTable>
            <AdminTableHead>
              <th className="px-5 py-3">用户</th>
              <th className="px-4 py-3">联系方式</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">信用分</th>
              <th className="px-4 py-3">比赛 / 申诉</th>
              <th className="px-5 py-3 text-right">操作</th>
            </AdminTableHead>
            <tbody className="divide-y divide-white/6">
              {users.map((user) => {
                const rating = user.ratings.find((item) => item.mode === "ONE_V_ONE");
                return (
                  <tr key={user.id} className="text-sm hover:bg-white/[0.018]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg border border-orange-400/20 bg-orange-400/8 text-xs font-black text-orange-200">{user.avatar}</span>
                        <div>
                          <div className="font-bold text-slate-100">{user.name}</div>
                          <div className="mt-0.5 text-xs text-slate-600">@{user.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-300">{user.phone}</div>
                      <div className="mt-1 text-xs text-slate-600">{user.email ?? "未填写邮箱"}</div>
                    </td>
                    <td className="px-4 py-4"><AdminBadge tone={user.isAdmin ? "violet" : user.isReferee ? "cyan" : "gray"}>{ROLE_LABEL[user.role] ?? user.role}</AdminBadge></td>
                    <td className="px-4 py-4"><AdminBadge tone={badgeTone(user.status)}>{USER_STATUS_LABEL[user.status]}</AdminBadge></td>
                    <td className="px-4 py-4 font-black text-white">{rating?.rating ?? "—"}</td>
                    <td className="px-4 py-4 font-bold text-slate-200">{user.creditScore}</td>
                    <td className="px-4 py-4 text-slate-400">{user._count.matchPlayers} / {user._count.disputes}</td>
                    <td className="px-5 py-4 text-right"><Link href={`/admin/users/${user.id}`} className="font-bold text-orange-300 hover:text-orange-200">查看详情</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        ) : <AdminEmpty>没有找到符合条件的用户。</AdminEmpty>}
      </AdminPanel>
    </>
  );
}
