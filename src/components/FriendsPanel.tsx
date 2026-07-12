"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Swords, Trash2, UserPlus, X } from "lucide-react";
import { Avatar, Button, Panel } from "@/components/ui";
import { RankBadge } from "@/components/RankBadge";

export type FriendPlayer = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  rankTitle: string;
  ratings: Array<{ mode: string; rating: number }>;
};

function bestRating(player: FriendPlayer) {
  return player.ratings.length ? Math.max(...player.ratings.map((rating) => rating.rating)) : null;
}

function PlayerRow({ player, children }: { player: FriendPlayer; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-black/24 p-3">
      <Avatar label={player.avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-white">{player.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">@{player.handle}</span>
          <RankBadge rating={bestRating(player)} title={player.rankTitle} size="sm" showIcon={false} />
        </div>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}

export function FriendsPanel({
  friends,
  incoming,
  outgoing,
  suggestions,
}: {
  friends: Array<{ friendshipId: string; friend: FriendPlayer }>;
  incoming: Array<{ id: string; from: FriendPlayer }>;
  outgoing: Array<{ id: string; to: FriendPlayer }>;
  suggestions: FriendPlayer[];
}) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<Response>, okText?: string) {
    setMessage(null);
    startTransition(async () => {
      const response = await action();
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error ?? "操作失败" });
        return;
      }
      if (okText) setMessage({ tone: "ok", text: okText });
      router.refresh();
    });
  }

  function addByHandle() {
    if (!handle.trim()) return;
    run(
      () =>
        fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: handle.trim() }),
        }),
      "好友申请已发送",
    );
    setHandle("");
  }

  function addById(userId: string) {
    run(
      () =>
        fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
      "好友申请已发送",
    );
  }

  function respond(id: string, action: "ACCEPT" | "DECLINE") {
    run(() =>
      fetch(`/api/friends/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    );
  }

  function remove(id: string) {
    run(() => fetch(`/api/friends/${id}`, { method: "DELETE" }));
  }

  function inviteToParty(inviteeId: string) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/party/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error ?? "邀请失败" });
        return;
      }
      router.push("/player/matchmaking");
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <div className="grid content-start gap-5">
        <Panel className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-300">
            <Search className="h-4 w-4 text-cyan-300" />
            通过 ID 或昵称添加好友
          </div>
          <div className="flex gap-2">
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addByHandle()}
              placeholder="输入球员 ID（如 SKY11）或昵称"
              className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none placeholder:text-slate-600 focus:border-orange-300/60"
            />
            <Button tone="orange" disabled={isPending} onClick={addByHandle}>
              <UserPlus className="h-4 w-4" />
              加好友
            </Button>
          </div>
          {message ? (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-sm font-black ${
                message.tone === "ok"
                  ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100"
                  : "border-red-400/35 bg-red-500/10 text-red-100"
              }`}
            >
              {message.text}
            </div>
          ) : null}
        </Panel>

        <Panel className="p-4 sm:p-5">
          <h2 className="mb-4 text-xl font-black text-white">
            我的好友 <span className="text-sm font-bold text-slate-500">{friends.length} 人</span>
          </h2>
          {friends.length ? (
            <div className="grid gap-3">
              {friends.map(({ friendshipId, friend }) => (
                <PlayerRow key={friendshipId} player={friend}>
                  <Button
                    tone="blue"
                    disabled={isPending}
                    onClick={() => inviteToParty(friend.id)}
                    className="min-h-9 px-3 py-1.5 text-xs"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    邀请组队
                  </Button>
                  <Button
                    tone="dark"
                    disabled={isPending}
                    onClick={() => remove(friendshipId)}
                    className="min-h-9 px-3 py-1.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </PlayerRow>
              ))}
            </div>
          ) : (
            <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-white/12 bg-black/22 text-sm font-bold text-slate-500">
              还没有好友，先从右侧推荐球友里加一个。
            </div>
          )}
        </Panel>
      </div>

      <div className="grid content-start gap-5">
        {incoming.length ? (
          <Panel className="border-orange-300/25 p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-black text-orange-100">收到的好友申请</h2>
            <div className="grid gap-3">
              {incoming.map((request) => (
                <PlayerRow key={request.id} player={request.from}>
                  <Button
                    tone="orange"
                    disabled={isPending}
                    onClick={() => respond(request.id, "ACCEPT")}
                    className="min-h-9 px-3 py-1.5 text-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    接受
                  </Button>
                  <Button
                    tone="dark"
                    disabled={isPending}
                    onClick={() => respond(request.id, "DECLINE")}
                    className="min-h-9 px-3 py-1.5 text-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </PlayerRow>
              ))}
            </div>
          </Panel>
        ) : null}

        {outgoing.length ? (
          <Panel className="p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-black text-white">等待对方接受</h2>
            <div className="grid gap-3">
              {outgoing.map((request) => (
                <PlayerRow key={request.id} player={request.to}>
                  <Button
                    tone="dark"
                    disabled={isPending}
                    onClick={() => remove(request.id)}
                    className="min-h-9 px-3 py-1.5 text-xs"
                  >
                    撤回
                  </Button>
                </PlayerRow>
              ))}
            </div>
          </Panel>
        ) : null}

        <Panel className="p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-black text-white">推荐球友</h2>
          {suggestions.length ? (
            <div className="grid gap-3">
              {suggestions.map((player) => (
                <PlayerRow key={player.id} player={player}>
                  <Button
                    tone="ghost"
                    disabled={isPending}
                    onClick={() => addById(player.id)}
                    className="min-h-9 px-3 py-1.5 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    加好友
                  </Button>
                </PlayerRow>
              ))}
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-500">暂无更多推荐。</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
