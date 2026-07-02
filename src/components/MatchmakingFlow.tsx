"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Crosshair,
  MapPinned,
  PlusCircle,
  Radar,
  ShieldCheck,
  Swords,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Avatar, Button, ButtonLink, Pill, StatusBadge } from "@/components/ui";
import {
  MATCH_MODE_LABEL,
  MATCH_TYPE_LABEL,
  SKILL_LEVEL_LABEL,
  TIME_SLOT_LABEL,
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
  ratingMin: number | null;
  ratingMax: number | null;
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

const ratingRanges = [
  { label: "青铜/白银", min: 800, max: 1100 },
  { label: "黄金附近", min: 1100, max: 1300 },
  { label: "铂金冲分", min: 1300, max: 1500 },
  { label: "高分局", min: 1500, max: 1800 },
];

function todayLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
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
  const ratingLabel =
    room.ratingMin && room.ratingMax ? `${room.ratingMin}-${room.ratingMax}` : room.mode === "RANKED" ? "不限 Rating" : null;

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
        {ratingLabel ? <Pill tone="gold">{ratingLabel}</Pill> : null}
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

export function MatchmakingFlow({ initialMode }: { initialMode: MatchMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<MatchMode>(initialMode);
  const [type, setType] = useState<MatchType>("ONE_V_ONE");
  const [date, setDate] = useState(todayLocal());
  const [timeSlot, setTimeSlot] = useState("EVENING");
  const [city, setCity] = useState("北京");
  const [district, setDistrict] = useState("ALL");
  const [gym, setGym] = useState("ALL");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("INTERMEDIATE");
  const [ratingRange, setRatingRange] = useState(ratingRanges[1]);
  const [rooms, setRooms] = useState<MatchmakingRoom[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    ratingMin: ratingRange.min,
    ratingMax: ratingRange.max,
  };

  function changeCity(nextCity: string) {
    setCity(nextCity);
    setDistrict("ALL");
    setGym("ALL");
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

  return (
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
            </div>
            <h1 className="text-3xl font-black text-white">单人快速匹配</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">什么时候、在哪里、打什么模式，交给系统先找局。</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-black/28 p-1">
              {(["CASUAL", "RANKED"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-md px-3 py-2 text-sm font-black ${
                    mode === item ? "bg-orange-500 text-black" : "text-slate-400"
                  }`}
                >
                  {item === "CASUAL" ? "开始匹配" : "我要排位"}
                </button>
              ))}
            </div>
            <Button tone="orange" disabled={isPending} onClick={searchRooms} className="h-12 min-w-44 text-sm">
              <Radar className="h-4 w-4" />
              {isPending ? "搜索中" : mode === "RANKED" ? "查找排位房" : "开始搜索球局"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <div className="mb-2 text-sm font-black text-slate-300">赛制</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setType("ONE_V_ONE")}
                className={`rounded-lg border p-4 text-left transition ${
                  type === "ONE_V_ONE"
                    ? "border-cyan-300/70 bg-cyan-400 text-black"
                    : "border-white/10 bg-white/[0.055] text-slate-200 hover:bg-white/10"
                }`}
              >
                <Swords className="mb-4 h-7 w-7" />
                <span className="block text-2xl font-black">1V1</span>
                <span className="mt-1 block text-sm font-black opacity-70">目标人数 2</span>
              </button>
              <button
                type="button"
                onClick={() => setType("THREE_V_THREE")}
                className={`rounded-lg border p-4 text-left transition ${
                  type === "THREE_V_THREE"
                    ? "border-cyan-300/70 bg-cyan-400 text-black"
                    : "border-white/10 bg-white/[0.055] text-slate-200 hover:bg-white/10"
                }`}
              >
                <UsersRound className="mb-4 h-7 w-7" />
                <span className="block text-2xl font-black">3V3</span>
                <span className="mt-1 block text-sm font-black opacity-70">目标人数 6</span>
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
                {Object.entries(TIME_SLOT_LABEL).map(([value, label]) => (
                  <OptionButton key={value} active={timeSlot === value} onClick={() => setTimeSlot(value)}>
                    {label}
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
                <Crosshair className="h-4 w-4" />
                Rating 范围
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                {ratingRanges.map((range) => (
                  <OptionButton
                    key={range.label}
                    active={ratingRange.label === range.label}
                    onClick={() => setRatingRange(range)}
                  >
                    <span className="block">{range.label}</span>
                    <span className="text-xs opacity-70">{range.min}-{range.max}</span>
                  </OptionButton>
                ))}
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
            <h2 className="text-2xl font-black text-white">匹配结果</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {searched ? (rooms.length ? `找到 ${rooms.length} 个可加入房间` : "暂无合适球局") : "提交后系统会先搜索已有房间"}
            </p>
          </div>
          <Pill tone={mode === "RANKED" ? "gold" : "green"}>
            {mode === "RANKED" ? <ShieldCheck className="mr-1 h-3 w-3" /> : <Radar className="mr-1 h-3 w-3" />}
            {mode === "RANKED" ? "需要远程裁判" : "无需裁判"}
          </Pill>
        </div>

        {!searched ? (
          <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-white/12 bg-black/22 text-center">
            <div className="max-w-sm px-5">
              <Radar className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
              <div className="text-xl font-black text-white">等待发起匹配</div>
              <p className="mt-2 text-sm font-bold text-slate-500">系统会先找已有房间，找不到再自动创建等待房。</p>
            </div>
          </div>
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
              系统会保留刚才的时间、地点、赛制和条件，并把你加入房间。
            </p>
            <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-black/24 p-3 text-sm font-black text-slate-300 sm:grid-cols-2">
              <span>{MATCH_TYPE_LABEL[type]} · 目标人数 {type === "THREE_V_THREE" ? 6 : 2}</span>
              <span>{city}{district !== "ALL" ? ` · ${district}` : ""}{gym !== "ALL" ? ` · ${gym}` : ""}</span>
              <span>{TIME_SLOT_LABEL[timeSlot]} · {date}</span>
              <span>{mode === "RANKED" ? `${ratingRange.min}-${ratingRange.max}` : SKILL_LEVEL_LABEL[skillLevel]}</span>
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
  );
}
