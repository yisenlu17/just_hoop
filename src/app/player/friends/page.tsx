import { AppShell } from "@/components/AppShell";
import { FriendsPanel } from "@/components/FriendsPanel";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFriendsOf, serializePlayer } from "@/lib/social";

export default async function FriendsPage() {
  const user = await requirePageUser();
  const [friends, pending] = await Promise.all([
    getFriendsOf(user.id),
    prisma.friendship.findMany({
      where: {
        status: "PENDING",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
      include: {
        requester: { include: { ratings: true } },
        addressee: { include: { ratings: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const relatedIds = new Set<string>([user.id]);
  for (const item of friends) relatedIds.add(item.friend.id);
  for (const item of pending) {
    relatedIds.add(item.requesterId);
    relatedIds.add(item.addresseeId);
  }
  const suggestions = await prisma.user.findMany({
    where: {
      id: { notIn: [...relatedIds] },
      status: "ACTIVE",
      isAdmin: false,
    },
    include: { ratings: true },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  return (
    <AppShell user={user} active="好友">
      <div className="mb-5">
        <h1 className="text-3xl font-black text-white">好友</h1>
        <p className="mt-1 text-sm font-bold text-slate-500">加好友、组队开黑，一起匹配对手。</p>
      </div>
      <FriendsPanel
        friends={friends}
        incoming={pending
          .filter((item) => item.addresseeId === user.id)
          .map((item) => ({ id: item.id, from: serializePlayer(item.requester) }))}
        outgoing={pending
          .filter((item) => item.requesterId === user.id)
          .map((item) => ({ id: item.id, to: serializePlayer(item.addressee) }))}
        suggestions={suggestions.map(serializePlayer)}
      />
    </AppShell>
  );
}
