import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActionButton, AdminActionForm } from "@/components/admin/AdminActions";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableHead,
  DetailItem,
} from "@/components/admin/AdminUI";
import {
  adminDate,
  badgeTone,
  DISPUTE_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  USER_STATUS_LABEL,
} from "@/lib/admin-domain";
import {
  formatMoney,
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  ROLE_LABEL,
  STATUS_META,
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const inputClass = "h-10 w-full rounded-lg border border-white/10 bg-[#080b11] px-3 text-sm text-white outline-none focus:border-orange-400/45";
const textareaClass = "min-h-24 w-full rounded-lg border border-white/10 bg-[#080b11] p-3 text-sm text-white outline-none focus:border-orange-400/45";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      ratings: true,
      matchPlayers: {
        include: { match: true },
        orderBy: { joinedAt: "desc" },
        take: 20,
      },
      createdMatches: { orderBy: { createdAt: "desc" }, take: 20 },
      disputes: { include: { match: true }, orderBy: { createdAt: "desc" } },
      payments: { include: { match: true }, orderBy: { createdAt: "desc" } },
      violations: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();

  return (
    <>
      <AdminPageHeader
        title={user.name}
        description={`@${user.handle} · 用户 ID ${user.id}`}
        actions={<Link href="/admin/users" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">返回用户列表</Link>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <AdminPanel className="p-5">
            <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-white/8 pb-5">
              <span className="grid h-16 w-16 place-items-center rounded-xl border border-orange-400/25 bg-orange-400/10 text-lg font-black text-orange-200">{user.avatar}</span>
              <div>
                <div className="flex flex-wrap gap-2">
                  <AdminBadge tone={user.isAdmin ? "violet" : user.isReferee ? "cyan" : "gray"}>{ROLE_LABEL[user.role]}</AdminBadge>
                  <AdminBadge tone={badgeTone(user.status)}>{USER_STATUS_LABEL[user.status]}</AdminBadge>
                </div>
                <div className="mt-2 text-sm text-slate-500">{user.city ?? "未填写城市"} · {user.district ?? "未填写区域"}</div>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="手机号">{user.phone}</DetailItem>
              <DetailItem label="邮箱">{user.email}</DetailItem>
              <DetailItem label="身高">{user.heightCm ? `${user.heightCm} cm` : "—"}</DetailItem>
              <DetailItem label="位置">{user.position}</DetailItem>
              <DetailItem label="惯用手">{user.dominantHand}</DetailItem>
              <DetailItem label="打球风格">{user.playStyle}</DetailItem>
              <DetailItem label="常去球场">{user.favoriteCourt}</DetailItem>
              <DetailItem label="注册时间">{adminDate(user.createdAt)}</DetailItem>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">排位数据</h2></div>
            <div className="grid gap-px bg-white/6 sm:grid-cols-2">
              {user.ratings.map((rating) => {
                const total = rating.wins + rating.losses;
                return (
                  <div key={rating.id} className="bg-[#0d121b] p-5">
                    <div className="text-sm font-bold text-slate-400">{MATCH_TYPE_LABEL[rating.mode]}</div>
                    <div className="mt-3 flex items-end gap-3">
                      <span className="text-3xl font-black text-white">{rating.rating}</span>
                      <span className="pb-1 text-sm font-bold text-orange-300">{user.rankTitle}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                      <DetailItem label="胜 / 负">{rating.wins} / {rating.losses}</DetailItem>
                      <DetailItem label="胜率">{total ? `${Math.round((rating.wins / total) * 100)}%` : "0%"}</DetailItem>
                      <DetailItem label="连胜">{rating.streak > 0 ? `${rating.streak} 连胜` : rating.streak < 0 ? `${Math.abs(rating.streak)} 连败` : "—"}</DetailItem>
                      <DetailItem label="净胜分">{rating.pointsFor - rating.pointsAgainst}</DetailItem>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">参加过的比赛</h2></div>
            <AdminTable>
              <AdminTableHead><th className="px-5 py-3">比赛</th><th className="px-4 py-3">模式</th><th className="px-4 py-3">比分</th><th className="px-4 py-3">状态</th><th className="px-5 py-3 text-right">详情</th></AdminTableHead>
              <tbody className="divide-y divide-white/6">
                {user.matchPlayers.map(({ match }) => (
                  <tr key={match.id} className="text-sm">
                    <td className="px-5 py-4 font-bold text-slate-200">{match.title}</td>
                    <td className="px-4 py-4 text-slate-500">{MATCH_MODE_LABEL[match.mode]} · {MATCH_TYPE_LABEL[match.type]}</td>
                    <td className="px-4 py-4 font-black text-white">{match.teamAScore}:{match.teamBScore}</td>
                    <td className="px-4 py-4"><AdminBadge tone={badgeTone(match.status)}>{STATUS_META[match.status]?.label}</AdminBadge></td>
                    <td className="px-5 py-4 text-right"><Link href={`/admin/matches/${match.id}`} className="font-bold text-orange-300">查看</Link></td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </AdminPanel>

          <div className="grid gap-5 lg:grid-cols-2">
            <AdminPanel>
              <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">创建过的比赛</h2></div>
              <div className="divide-y divide-white/6 px-5">
                {user.createdMatches.map((match) => (
                  <Link key={match.id} href={`/admin/matches/${match.id}`} className="flex items-center justify-between gap-3 py-4">
                    <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-200">{match.title}</span><span className="mt-1 block text-xs text-slate-600">{adminDate(match.createdAt)}</span></span>
                    <AdminBadge tone={badgeTone(match.status)}>{STATUS_META[match.status]?.label}</AdminBadge>
                  </Link>
                ))}
                {!user.createdMatches.length ? <div className="py-8 text-center text-sm text-slate-600">没有创建记录</div> : null}
              </div>
            </AdminPanel>
            <AdminPanel>
              <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">申诉记录</h2></div>
              <div className="divide-y divide-white/6 px-5">
                {user.disputes.map((dispute) => (
                  <Link key={dispute.id} href={`/admin/disputes/${dispute.id}`} className="block py-4">
                    <div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-bold text-slate-200">{dispute.match.title}</span><AdminBadge tone={badgeTone(dispute.status)}>{DISPUTE_STATUS_LABEL[dispute.status]}</AdminBadge></div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{dispute.reason}</p>
                  </Link>
                ))}
                {!user.disputes.length ? <div className="py-8 text-center text-sm text-slate-600">没有申诉记录</div> : null}
              </div>
            </AdminPanel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <AdminPanel>
              <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">支付记录</h2></div>
              <div className="divide-y divide-white/6 px-5">
                {user.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 py-4">
                    <span><span className="block text-sm font-bold text-slate-200">{payment.match.title}</span><span className="mt-1 block text-xs text-slate-600">{formatMoney(payment.amount)}</span></span>
                    <AdminBadge tone={badgeTone(payment.status)}>{PAYMENT_STATUS_LABEL[payment.status]}</AdminBadge>
                  </div>
                ))}
                {!user.payments.length ? <div className="py-8 text-center text-sm text-slate-600">没有支付记录</div> : null}
              </div>
            </AdminPanel>
            <AdminPanel>
              <div className="border-b border-white/8 px-5 py-4"><h2 className="font-black text-white">违规记录</h2></div>
              <div className="divide-y divide-white/6 px-5">
                {user.violations.map((item) => (
                  <div key={item.id} className="py-4">
                    <div className="flex justify-between gap-3"><span className="text-sm font-bold text-slate-200">{item.reason}</span><span className="text-sm font-black text-red-300">{item.creditDelta}</span></div>
                    <div className="mt-1 text-xs text-slate-600">{adminDate(item.createdAt)}</div>
                  </div>
                ))}
                {!user.violations.length ? <div className="py-8 text-center text-sm text-slate-600">没有违规记录</div> : null}
              </div>
            </AdminPanel>
          </div>
        </div>

        <aside className="space-y-5">
          <AdminPanel className="p-5">
            <h2 className="font-black text-white">账号状态</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">危险操作会要求二次确认，并记录管理员日志。</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user.status === "BANNED" ? (
                <AdminActionButton action="SET_USER_STATUS" payload={{ userId: user.id, status: "ACTIVE", note: "管理员手动解封" }} confirm={`确认解封 ${user.name}？`} tone="success">解封用户</AdminActionButton>
              ) : (
                <AdminActionButton action="SET_USER_STATUS" payload={{ userId: user.id, status: "BANNED", note: "管理员手动封禁" }} confirm={`确认封禁 ${user.name}？该用户将无法进入受保护页面。`} tone="danger">封禁用户</AdminActionButton>
              )}
              <AdminActionButton action="SET_USER_STATUS" payload={{ userId: user.id, status: "PENDING_REVIEW", note: "转为待审核状态" }} confirm="确认将账号设为待审核？">设为待审核</AdminActionButton>
            </div>
          </AdminPanel>

          <AdminPanel className="p-5">
            <h2 className="font-black text-white">信用分</h2>
            <div className="mt-2 text-4xl font-black text-white">{user.creditScore}</div>
            <AdminActionForm action="ADJUST_USER_CREDIT" payload={{ userId: user.id }} submitLabel="调整信用分" confirm="确认调整该用户信用分？" className="mt-4">
              <label className="text-xs font-bold text-slate-500">调整值（-100 至 100）</label>
              <input className={`${inputClass} mt-2`} name="delta" type="number" min="-100" max="100" required placeholder="-5 或 10" />
              <label className="mt-3 block text-xs font-bold text-slate-500">原因</label>
              <textarea className={`${textareaClass} mt-2`} name="note" required placeholder="说明调整原因；扣分会自动形成违规记录" />
            </AdminActionForm>
          </AdminPanel>

          <AdminPanel className="p-5">
            <h2 className="font-black text-white">管理员备注</h2>
            <AdminActionForm action="UPDATE_USER_NOTE" payload={{ userId: user.id }} submitLabel="保存备注" className="mt-4">
              <textarea className={textareaClass} name="note" defaultValue={user.adminNote ?? ""} placeholder="仅管理员可见" />
            </AdminActionForm>
          </AdminPanel>
        </aside>
      </div>
    </>
  );
}
