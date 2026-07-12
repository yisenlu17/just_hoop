"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  LogOut,
  MapPinned,
  Plus,
  PlusCircle,
  Radar,
  ShieldCheck,
  Swords,
  Trophy,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { Avatar, Button, ButtonLink, Pill, StatusBadge } from "@/components/ui";
import { RankBadge } from "@/components/RankBadge";
import {
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  SKILL_LEVEL_LABEL,
  TIME_SLOT_LABEL,
  TIME_SLOT_META,
  formatMoney,
} from "@/lib/domain";

type MatchMode = "CASUAL" | "RANKED";
type MatchType = "ONE_V_ONE" | "THREE_V_THREE";
type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "OPEN";

type MatchmakingRoom = {
  id: string;
  code: string;
  title: string;
  mode: MatchMode;
  type: MatchType;
  status: string;
  location: string;
  scheduledLabel: string;
  timeSlotLabel: string;
  skillLevelLabel: string | null;
  playerCount: number;
  maxPlayers: number;
  buyInLabel: string;
  refereeName: string | null;
  players: Array<{
    id: string;
    name: string;
    handle: string;
    avatar: string;
    team: string;
  }>;
};

export type LobbyPlayer = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  rankTitle: string;
  ratings: Array<{ mode: string; rating: number }>;
};

type PartyInfo = {
  id: string;
  leaderId: string;
  isLeader: boolean;
  mode: MatchMode;
  type: MatchType;
  matchId: string | null;
  maxMembers: number;
  members: Array<LobbyPlayer & { seat: number }>;
};

type PartyInviteInfo = {
  id: string;
  partyId: string;
  mode: MatchMode;
  type: MatchType;
  memberCount: number;
  inviter: LobbyPlayer;
};

type OutgoingInvite = { id: string; invitee: LobbyPlayer };

const PARTY_MAX = 3;

const cityMap: Record<string, Record<string, string[]>> = {
  北京: {
    海淀: ["五棵松", "中关村球馆"],
    朝阳: ["朝阳公园", "望京运动中心"],
    东城: ["东单"],
  },
  上海: {
    静安: ["静安体育中心"],
    浦东: ["滨江篮球公园"],
    徐汇: ["徐家汇篮球馆"],
  },
};

function todayLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function bestRating(player: LobbyPlayer) {
  return player.ratings.length ? Math.max(...player.ratings.map((rating) => rating.rating)) : null;
}

function ratingForType(player: LobbyPlayer, type: MatchType) {
  return player.ratings.find((rating) => rating.mode === type)?.rating ?? 1000;
}

function OptionButton({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-black transition ${
        active
          ? "border-orange-300/70 bg-orange-500 text-black shadow-[0_0_22px_rgba(249,115,22,0.18)]"
          : "border-white/10 bg-white/[0.055] text-slate-300 hover:border-white/25 hover:bg-white/10"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function RoomResultCard({
  room,
  onJoin,
  joining,
}: {
  room: MatchmakingRoom;
  onJoin: (id: string) => void;
  joining: boolean;
}) {
  return (
    <article className="rounded-lg border border-cyan-300/18 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),rgba(255,255,255,0.055))] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Pill tone={room.mode === "RANKED" ? "gold" : "orange"}>{MATCH_MODE_LABEL[room.mode]}</Pill>
            <Pill tone="blue">{MATCH_TYPE_LABEL[room.type]}</Pill>
            <StatusBadge status={room.status} />
          </div>
          <h3 className="text-xl font-black text-white">{room.title}</h3>
          <p className="mt-1 text-sm font-bold text-slate-400">
            {room.location} · {room.scheduledLabel} · {room.timeSlotLabel}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">
            {room.playerCount}/{room.maxPlayers}
          </div>
          <div className="text-xs font-black text-slate-500">{room.code}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {room.skillLevelLabel ? <Pill tone="green">{room.skillLevelLabel}</Pill> : null}
        {room.mode === "RANKED" ? <Pill tone="gold">同段或相邻段位</Pill> : null}
        <Pill tone="gray">{room.buyInLabel}</Pill>
        <Pill tone={room.mode === "RANKED" ? "blue" : "gray"}>
          {room.mode === "RANKED" ? `远程裁判 ${room.refereeName ?? "待确认"}` : "无需裁判"}
        </Pill>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {room.players.map((player) => (
          <div key={player.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/24 p-2">
            <Avatar label={player.avatar} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">{player.name}</div>
              <div className="truncate text-xs font-bold text-slate-500">TEAM {player.team}</div>
            </div>
          </div>
        ))}
        {Array.from({ length: Math.max(room.maxPlayers - room.playerCount, 0) }).slice(0, 3).map((_, index) => (
          <div key={`empty-${index}`} className="rounded-lg border border-dashed border-white/10 bg-black/18 p-3 text-sm font-black text-slate-500">
            等待加入
          </div>
        ))}
      </div>

      <Button tone="blue" disabled={joining} onClick={() => onJoin(room.id)} className="w-full">
        <CheckCircle2 className="h-4 w-4" />
        选择并加入
      </Button>
    </article>
  );
}

// 王者荣耀式组队席位：自己一格，剩余席位可点 + 邀请好友。
function PartySeats({
  viewer,
  party,
  outgoingInvites,
  isPending,
  onOpenPicker,
  onLeave,
}: {
  viewer: LobbyPlayer;
  party: PartyInfo | null;
  outgoingInvites: OutgoingInvite[];
  isPending: boolean;
  onOpenPicker: () => void;
  onLeave: () => void;
}) {
  const members: Array<LobbyPlayer & { seat?: number }> = party ? party.members : [viewer];
  const leaderId = party?.leaderId ?? viewer.id;
  const isLeader = party ? party.isLeader : true;
  const invitingSeats = outgoingInvites.slice(0, Math.max(PARTY_MAX - members.length, 0));
  const emptyCount = Math.max(PARTY_MAX - members.length - invitingSeats.length, 0);

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),rgba(2,6,23,0.6))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-cyan-100">
          <UsersRound className="h-4 w-4" />
          组队席位
          <Pill tone="blue">{members.length}/{PARTY_MAX}</Pill>
          {members.length > 1 ? <Pill tone="green">整队一起匹配对手</Pill> : null}
        </div>
        {party ? (
          <Button tone="dark" disabled={isPending} onClick={onLeave} className="min-h-9 px-3 py-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" />
            {party.isLeader ? "解散队伍" : "退出队伍"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              member.id === viewer.id
                ? "border-orange-300/45 bg-orange-500/10"
                : "border-white/10 bg-black/28"
            }`}
          >
            <Avatar label={member.avatar} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-black text-white">{member.name}</span>
                {member.id === leaderId ? <Crown className="h-3.5 w-3.5 shrink-0 text-yellow-300" /> : null}
              </div>
              <div className="mt-1">
                <RankBadge rating={bestRating(member)} title={member.rankTitle} size="sm" showIcon={false} />
              </div>
            </div>
          </div>
        ))}

        {invitingSeats.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center gap-3 rounded-lg border border-dashed border-cyan-300/30 bg-cyan-400/6 p-3"
          >
            <Avatar label={invite.invitee.avatar} />
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-cyan-100">{invite.invitee.name}</div>
              <div className="text-xs font-bold text-slate-500">邀请中，等待接受…</div>
            </div>
          </div>
        ))}

        {Array.from({ length: emptyCount }).map((_, index) =>
          isLeader ? (
            <button
              key={`seat-${index}`}
              type="button"
              disabled={isPending}
              onClick={onOpenPicker}
              className="group grid min-h-[68px] place-items-center rounded-lg border border-dashed border-white/18 bg-black/22 transition hover:border-orange-300/60 hover:bg-orange-500/8"
            >
              <span className="flex items-center gap-2 text-sm font-black text-slate-400 group-hover:text-orange-200">
                <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/8 group-hover:border-orange-300/60">
                  <Plus className="h-4 w-4" />
                </span>
                邀请好友
              </span>
            </button>
          ) : (
            <div
              key={`seat-${index}`}
              className="grid min-h-[68px] place-items-center rounded-lg border border-dashed border-white/12 bg-black/18 text-sm font-black text-slate-600"
            >
              等待队长邀请
            </div>
          ),
        )}
      </div>
    </section>
  );
}

export function MatchmakingFlow({
  initialMode,
  viewer,
  recommended,
}: {
  initialMode: MatchMode;
  viewer: LobbyPlayer;
  recommended: Record<MatchMode, MatchmakingRoom[]>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<MatchMode>(initialMode);
  const [type, setType] = useState<MatchType>("ONE_V_ONE");
  const [date, setDate] = useState(todayLocal());
  const [timeSlot, setTimeSlot] = useState("EVENING");
  const [city, setCity] = useState("北京");
  const [district, setDistrict] = useState("ALL");
  const [gym, setGym] = useState("ALL");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("INTERMEDIATE");
  const [rooms, setRooms] = useState<MatchmakingRoom[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 组队状态
  const [party, setParty] = useState<PartyInfo | null>(null);
  const [invites, setInvites] = useState<PartyInviteInfo[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<OutgoingInvite[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [friends, setFriends] = useState<Array<{ friendshipId: string; friend: LobbyPlayer }> | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const prevMatchIdRef = useRef<string | null | undefined>(undefined);

  const partySize = party?.members.length ?? 1;
  const isLeader = party ? party.isLeader : true;

  const fetchParty = useCallback(async () => {
    try {
      const response = await fetch("/api/party", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        party: PartyInfo | null;
        invites: PartyInviteInfo[];
        outgoingInvites: OutgoingInvite[];
      };
      setParty(data.party);
      setInvites(data.invites ?? []);
      setOutgoingInvites(data.outgoingInvites ?? []);

      if (data.party && data.party.members.length > 1) {
        // 组队后统一按 3V3 展示；队员的模式跟随队长。
        setType("THREE_V_THREE");
        if (!data.party.isLeader) setMode(data.party.mode);
      }

      // 队长带队进房后，队员自动跳转到房间页。
      const nextMatchId = data.party?.matchId ?? null;
      if (
        prevMatchIdRef.current !== undefined &&
        nextMatchId &&
        nextMatchId !== prevMatchIdRef.current &&
        data.party &&
        !data.party.isLeader
      ) {
        router.push(`/player/matches/${nextMatchId}`);
      }
      prevMatchIdRef.current = nextMatchId;
    } catch {
      // 轮询失败静默重试
    }
  }, [router]);

  useEffect(() => {
    const initial = setTimeout(fetchParty, 0);
    const timer = setInterval(fetchParty, 8000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [fetchParty]);

  const districts = useMemo(() => Object.keys(cityMap[city] ?? {}), [city]);
  const gyms = useMemo(() => {
    if (district !== "ALL") return cityMap[city]?.[district] ?? [];
    return Object.values(cityMap[city] ?? {}).flat();
  }, [city, district]);

  const payload = {
    mode,
    type,
    date,
    timeSlot,
    city,
    district,
    gym,
    skillLevel,
  };

  const recommendedRooms = useMemo(() => {
    const list = recommended[mode] ?? [];
    return partySize > 1 ? list.filter((room) => room.type === "THREE_V_THREE") : list;
  }, [recommended, mode, partySize]);

  function changeCity(nextCity: string) {
    setCity(nextCity);
    setDistrict("ALL");
    setGym("ALL");
  }

  function changeMode(nextMode: MatchMode) {
    setMode(nextMode);
    if (party && isLeader) {
      // 同步给队员看到一致的模式。
      fetch("/api/party", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode }),
      }).catch(() => {});
    }
  }

  function changeType(nextType: MatchType) {
    if (nextType === "ONE_V_ONE" && partySize > 1) return;
    setType(nextType);
  }

  function searchRooms() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/matchmaking/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { matches?: MatchmakingRoom[]; error?: string };
      if (!response.ok) {
        setError(data.error ?? "匹配失败");
        return;
      }
      setRooms(data.matches ?? []);
      setSearched(true);
    });
  }

  function autoCreate() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/matchmaking/auto-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "自动创建失败");
        return;
      }
      router.push(`/player/matches/${data.id}`);
    });
  }

  function joinRoom(id: string) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/matches/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "加入失败");
        return;
      }
      router.push(`/player/matches/${id}`);
    });
  }

  function openPicker() {
    setPickerError(null);
    setPickerOpen(true);
    if (friends === null) {
      fetch("/api/friends", { cache: "no-store" })
        .then((response) => response.json())
        .then((data: { friends?: Array<{ friendshipId: string; friend: LobbyPlayer }> }) => {
          setFriends(data.friends ?? []);
        })
        .catch(() => setFriends([]));
    }
  }

  function sendInvite(inviteeId: string) {
    setPickerError(null);
    startTransition(async () => {
      const response = await fetch("/api/party/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId, mode }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setPickerError(data.error ?? "邀请失败");
        return;
      }
      await fetchParty();
    });
  }

  function respondInvite(inviteId: string, action: "ACCEPT" | "DECLINE") {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/party/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "操作失败");
      }
      await fetchParty();
    });
  }

  function leaveParty() {
    startTransition(async () => {
      await fetch("/api/party", { method: "DELETE" });
      await fetchParty();
    });
  }

  const memberIdsInParty = new Set([
    ...(party?.members.map((member) => member.id) ?? [viewer.id]),
    ...outgoingInvites.map((invite) => invite.invitee.id),
  ]);
  const invitableFriends = (friends ?? []).filter(({ friend }) => !memberIdsInParty.has(friend.id));

  return (
    <div className="grid gap-5">
      {invites.length ? (
        <div className="grid gap-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-300/40 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),rgba(2,6,23,0.7))] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar label={invite.inviter.avatar} size="sm" />
                <div className="text-sm font-black text-white">
                  {invite.inviter.name} 邀请你加入
                  <span className="mx-1 text-orange-200">
                    {MATCH_MODE_LABEL[invite.mode]} {MATCH_TYPE_LABEL[invite.type]}
                  </span>
                  组队（{invite.memberCount}/{PARTY_MAX} 人）
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  tone="orange"
                  disabled={isPending}
                  onClick={() => respondInvite(invite.id, "ACCEPT")}
                  className="min-h-9 px-3 py-1.5 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  接受
                </Button>
                <Button
                  tone="dark"
                  disabled={isPending}
                  onClick={() => respondInvite(invite.id, "DECLINE")}
                  className="min-h-9 px-3 py-1.5 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  拒绝
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {type === "THREE_V_THREE" ? (
        <PartySeats
          viewer={viewer}
          party={party}
          outgoingInvites={outgoingInvites}
          isPending={isPending}
          onOpenPicker={openPicker}
          onLeave={leaveParty}
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <section className="rounded-lg border border-white/10 bg-slate-950/62 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Pill tone={mode === "RANKED" ? "gold" : "orange"}>
                  {mode === "RANKED" ? <Trophy className="mr-1 h-3 w-3" /> : <Radar className="mr-1 h-3 w-3" />}
                  {MATCH_MODE_LABEL[mode]}
                </Pill>
                <Pill tone="blue">{MATCH_TYPE_LABEL[type]}</Pill>
                {partySize > 1 ? <Pill tone="green">{partySize} 人车队</Pill> : null}
              </div>
              <h1 className="text-3xl font-black text-white">快速匹配</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">
                什么时候、在哪里、打什么模式；3V3 还能拉上好友一起。
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-black/28 p-1">
                {(["CASUAL", "RANKED"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeMode(item)}
                    disabled={partySize > 1 && !isLeader}
                    className={`rounded-md px-3 py-2 text-sm font-black disabled:cursor-not-allowed ${
                      mode === item ? "bg-orange-500 text-black" : "text-slate-400"
                    }`}
                  >
                    {item === "CASUAL" ? "开始匹配" : "我要排位"}
                  </button>
                ))}
              </div>
              <Button
                tone="orange"
                disabled={isPending || (partySize > 1 && !isLeader)}
                onClick={searchRooms}
                className="h-12 min-w-44 text-sm"
              >
                <Radar className="h-4 w-4" />
                {partySize > 1 && !isLeader
                  ? "等队长发起匹配"
                  : isPending
                    ? "搜索中"
                    : mode === "RANKED"
                      ? "查找排位房"
                      : "开始搜索球局"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <div className="mb-2 text-sm font-black text-slate-300">赛制</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => changeType("ONE_V_ONE")}
                  disabled={partySize > 1}
                  className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    type === "ONE_V_ONE"
                      ? "border-cyan-300/70 bg-cyan-400 text-black"
                      : "border-white/10 bg-white/[0.055] text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <Swords className="mb-4 h-7 w-7" />
                  <span className="block text-2xl font-black">1V1</span>
                  <span className="mt-1 block text-sm font-black opacity-70">
                    {partySize > 1 ? "组队时不可选" : "目标人数 2"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => changeType("THREE_V_THREE")}
                  className={`rounded-lg border p-4 text-left transition ${
                    type === "THREE_V_THREE"
                      ? "border-cyan-300/70 bg-cyan-400 text-black"
                      : "border-white/10 bg-white/[0.055] text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <UsersRound className="mb-4 h-7 w-7" />
                  <span className="block text-2xl font-black">3V3</span>
                  <span className="mt-1 block text-sm font-black opacity-70">目标人数 6 · 可组队</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <label className="grid gap-2 rounded-lg border border-white/10 bg-black/24 p-3 text-sm font-black text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-orange-300" />
                  日期
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none focus:border-orange-300/60"
                />
              </label>
              <div className="rounded-lg border border-white/10 bg-black/24 p-3">
                <div className="mb-2 text-sm font-black text-slate-300">时间段</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(TIME_SLOT_META).map(([value, meta]) => (
                    <OptionButton key={value} active={timeSlot === value} onClick={() => setTimeSlot(value)}>
                      <span className="block">{meta.label}</span>
                      <span className="block text-xs opacity-70">{meta.range}</span>
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/24 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-300">
                <MapPinned className="h-4 w-4 text-cyan-300" />
                城市 / 区域 / 球馆
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {Object.keys(cityMap).map((item) => (
                  <OptionButton key={item} active={city === item} onClick={() => changeCity(item)}>
                    {item}
                  </OptionButton>
                ))}
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <OptionButton active={district === "ALL"} onClick={() => { setDistrict("ALL"); setGym("ALL"); }}>
                  全城
                </OptionButton>
                {districts.map((item) => (
                  <OptionButton key={item} active={district === item} onClick={() => { setDistrict(item); setGym("ALL"); }}>
                    {item}
                  </OptionButton>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <OptionButton active={gym === "ALL"} onClick={() => setGym("ALL")}>
                  全部球馆
                </OptionButton>
                {gyms.map((item) => (
                  <OptionButton key={item} active={gym === item} onClick={() => setGym(item)}>
                    {item}
                  </OptionButton>
                ))}
              </div>
            </div>

            {mode === "CASUAL" ? (
              <div className="rounded-lg border border-white/10 bg-black/24 p-3">
                <div className="mb-2 text-sm font-black text-slate-300">水平</div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {Object.entries(SKILL_LEVEL_LABEL).map(([value, label]) => (
                    <OptionButton key={value} active={skillLevel === value} onClick={() => setSkillLevel(value as SkillLevel)}>
                      {label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-300/16 bg-yellow-300/7 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-yellow-100">
                  <ShieldCheck className="h-4 w-4" />
                  系统按段位自动匹配
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-300">
                  <RankBadge rating={ratingForType(viewer, type)} showIcon={false} />
                  <span>只会进入相同大段或相邻一个大段的房间，无需手动选择分数区间。</span>
                </div>
              </div>
            )}

            {error ? (
              <div className="rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm font-black text-red-100">
                {error}
              </div>
            ) : null}

          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-950/62 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">{searched ? "匹配结果" : "推荐房间"}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">
                {searched
                  ? rooms.length
                    ? `找到 ${rooms.length} 个可加入房间`
                    : "暂无合适球局"
                  : mode === "RANKED"
                    ? "为你推荐可加入的排位房间"
                    : "为你推荐可加入的匹配房间"}
              </p>
            </div>
            <Pill tone={mode === "RANKED" ? "gold" : "green"}>
              {mode === "RANKED" ? <ShieldCheck className="mr-1 h-3 w-3" /> : <Radar className="mr-1 h-3 w-3" />}
              {mode === "RANKED" ? "需要远程裁判" : "无需裁判"}
            </Pill>
          </div>

          {!searched ? (
            recommendedRooms.length ? (
              <div className="grid gap-4">
                {recommendedRooms.map((room) => (
                  <RoomResultCard key={room.id} room={room} joining={isPending} onJoin={joinRoom} />
                ))}
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-white/12 bg-black/22 text-center">
                <div className="max-w-sm px-5">
                  <Radar className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                  <div className="text-xl font-black text-white">
                    {mode === "RANKED" ? "暂无推荐排位房间" : "暂无推荐匹配房间"}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-500">发起搜索，系统会先找已有房间，找不到再自动创建等待房。</p>
                </div>
              </div>
            )
          ) : rooms.length ? (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <RoomResultCard key={room.id} room={room} joining={isPending} onJoin={joinRoom} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-orange-300/35 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),rgba(0,0,0,0.28))] p-5">
              <PlusCircle className="mb-5 h-10 w-10 text-orange-200" />
              <h3 className="text-2xl font-black text-white">暂无合适球局，是否自动创建等待房间？</h3>
              <p className="mt-2 text-sm font-bold text-slate-400">
                {partySize > 1
                  ? `系统会保留刚才的条件，并把整队 ${partySize} 人一起加入房间。`
                  : "系统会保留刚才的时间、地点、赛制和条件，并把你加入房间。"}
              </p>
              <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-black/24 p-3 text-sm font-black text-slate-300 sm:grid-cols-2">
                <span>{MATCH_TYPE_LABEL[type]} · 目标人数 {type === "THREE_V_THREE" ? 6 : 2}</span>
                <span>{city}{district !== "ALL" ? ` · ${district}` : ""}{gym !== "ALL" ? ` · ${gym}` : ""}</span>
                <span>{date} · {TIME_SLOT_LABEL[timeSlot]} · {TIME_SLOT_META[timeSlot as keyof typeof TIME_SLOT_META].defaultTime} 开赛</span>
                <span>{mode === "RANKED" ? "同段或相邻段位 · 系统自动匹配" : SKILL_LEVEL_LABEL[skillLevel]}</span>
                <span>{mode === "RANKED" ? "远程裁判" : "无需裁判"}</span>
                <span>{formatMoney(mode === "RANKED" ? (type === "THREE_V_THREE" ? 1800 : 1200) : 0)}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button tone="orange" disabled={isPending} onClick={autoCreate} className="h-13">
                  <PlusCircle className="h-5 w-5" />
                  自动创建等待房间
                </Button>
                <ButtonLink href="/player/matches/create" tone="dark">
                  手动创建
                </ButtonLink>
              </div>
            </div>
          )}
        </section>
      </div>

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-white/12 bg-slate-950/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-white">
                <UserPlus className="h-4 w-4 text-orange-300" />
                邀请好友组队
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/6 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {pickerError ? (
              <div className="mb-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm font-black text-red-100">
                {pickerError}
              </div>
            ) : null}

            {friends === null ? (
              <div className="grid min-h-32 place-items-center text-sm font-bold text-slate-500">加载好友中…</div>
            ) : invitableFriends.length ? (
              <div className="grid max-h-80 gap-2 overflow-y-auto">
                {invitableFriends.map(({ friendshipId, friend }) => (
                  <div
                    key={friendshipId}
                    className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/24 p-3"
                  >
                    <Avatar label={friend.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">{friend.name}</div>
                      <div className="mt-0.5">
                        <RankBadge rating={bestRating(friend)} title={friend.rankTitle} size="sm" showIcon={false} />
                      </div>
                    </div>
                    <Button
                      tone="blue"
                      disabled={isPending}
                      onClick={() => sendInvite(friend.id)}
                      className="min-h-9 px-3 py-1.5 text-xs"
                    >
                      邀请
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-white/12 bg-black/22 text-center text-sm font-bold text-slate-500">
                <div>
                  没有可邀请的好友了。
                  <ButtonLink href="/player/friends" tone="dark" className="mt-3 min-h-9 px-3 py-1.5 text-xs">
                    去添加好友
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
