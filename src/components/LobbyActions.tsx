import Link from "next/link";
import { Crosshair, MapPinned, Radar, Trophy, Zap } from "lucide-react";

export function LobbyActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/player/matchmaking?mode=CASUAL"
        className="group min-h-40 rounded-lg border border-orange-300/45 bg-orange-500 p-5 text-left text-black shadow-[0_0_42px_rgba(249,115,22,0.24)] transition hover:bg-orange-400"
      >
        <Zap className="mb-5 h-8 w-8" />
        <span className="block text-3xl font-black tracking-normal">开始匹配</span>
        <span className="mt-2 block text-sm font-black text-black/70">选时间和球馆，系统先帮你找局</span>
        <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-xs font-black">
          <MapPinned className="h-4 w-4" />
          可邀好友组队开黑
        </span>
      </Link>
      <Link
        href="/player/matchmaking?mode=RANKED"
        className="group min-h-40 rounded-lg border border-yellow-200/45 bg-[linear-gradient(135deg,#ffd166,#f97316_58%,#7c2d12)] p-5 text-left text-black shadow-[0_0_42px_rgba(250,204,21,0.2)] transition hover:brightness-110"
      >
        <Trophy className="mb-5 h-8 w-8" />
        <span className="block text-3xl font-black tracking-normal">我要排位</span>
        <span className="mt-2 block text-sm font-black text-black/70">系统自动匹配同段或相邻段位</span>
        <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-xs font-black">
          <Crosshair className="h-4 w-4" />
          远程裁判排位
        </span>
      </Link>
      <div className="sm:col-span-2 rounded-lg border border-cyan-300/20 bg-cyan-400/8 px-4 py-3 text-sm font-bold text-cyan-100">
        <Radar className="mr-2 inline h-4 w-4" />
        选择什么时候、在哪里、打什么模式；平台先找房间，找不到再帮你自动建等待房。
      </div>
    </div>
  );
}
