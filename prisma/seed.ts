import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  MatchMode,
  MatchStatus,
  MatchType,
  PaymentStatus,
  PrismaClient,
  UserRole,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60 * 1000);

async function main() {
  await prisma.adminLog.deleteMany();
  await prisma.refereeApplication.deleteMany();
  await prisma.violationRecord.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.refereeEvent.deleteMany();
  await prisma.matchPlayer.deleteMany();
  await prisma.match.deleteMany();
  await prisma.playerRating.deleteMany();
  await prisma.user.deleteMany();

  const yisen = await prisma.user.create({
    data: {
      phone: "18800000001",
      email: "yisen@justhoop.test",
      name: "一森",
      handle: "YISEN",
      role: UserRole.PLAYER,
      avatar: "YS",
      city: "北京",
      district: "海淀",
      heightCm: 182,
      position: "得分后卫",
      dominantHand: "右手",
      playStyle: "持球突破、急停中投",
      creditScore: 96,
      rankTitle: "黄金 II",
      favoriteCourt: "五棵松夜场",
    },
  });
  const xiaoyu = await prisma.user.create({
    data: {
      phone: "18800000002",
      email: "xiaoyu@justhoop.test",
      name: "小宇",
      handle: "SKY11",
      role: UserRole.PLAYER,
      avatar: "XY",
      city: "北京",
      district: "朝阳",
      heightCm: 176,
      position: "控球后卫",
      dominantHand: "左手",
      playStyle: "快速推进、组织串联",
      creditScore: 100,
      rankTitle: "白银 I",
      favoriteCourt: "朝阳公园北场",
    },
  });
  const hao = await prisma.user.create({
    data: {
      phone: "18800000003",
      email: "hao@justhoop.test",
      name: "阿豪",
      handle: "HaoBuckets",
      role: UserRole.PLAYER,
      avatar: "AH",
      city: "北京",
      district: "东城",
      heightCm: 188,
      position: "小前锋",
      dominantHand: "右手",
      playStyle: "强侧单打、转换终结",
      creditScore: 91,
      rankTitle: "铂金 IV",
      favoriteCourt: "东单",
    },
  });
  const chen = await prisma.user.create({
    data: {
      phone: "18800000004",
      email: "chen@justhoop.test",
      name: "陈队",
      handle: "CaptainChen",
      role: UserRole.PLAYER,
      avatar: "CD",
      city: "上海",
      district: "静安",
      heightCm: 190,
      position: "大前锋",
      dominantHand: "右手",
      playStyle: "挡拆顺下、篮板保护",
      creditScore: 98,
      rankTitle: "黄金 I",
      favoriteCourt: "静安体育中心",
    },
  });
  const lin = await prisma.user.create({
    data: {
      phone: "18800000005",
      email: "lin@justhoop.test",
      name: "林风",
      handle: "Wind3",
      role: UserRole.PLAYER,
      avatar: "LF",
      city: "上海",
      district: "浦东",
      heightCm: 180,
      position: "双能卫",
      dominantHand: "右手",
      playStyle: "无球跑动、外线投射",
      creditScore: 84,
      rankTitle: "白银 II",
      favoriteCourt: "滨江篮球公园",
    },
  });
  const referee = await prisma.user.create({
    data: {
      phone: "18800000901",
      email: "zhou@justhoop.test",
      name: "裁判周",
      handle: "REF-Zhou",
      role: UserRole.REFEREE,
      isReferee: true,
      avatar: "RZ",
      city: "北京",
      district: "西城",
      creditScore: 100,
      rankTitle: "认证裁判",
      favoriteCourt: "远程执裁中心",
    },
  });
  const admin = await prisma.user.create({
    data: {
      phone: "18800000999",
      email: "ops@justhoop.test",
      name: "运营管理员",
      handle: "JustHoopOps",
      role: UserRole.ADMIN,
      isAdmin: true,
      avatar: "OP",
      city: "北京",
      district: "朝阳",
      creditScore: 100,
      adminNote: "平台超级管理员测试账号",
      rankTitle: "平台运营",
      favoriteCourt: "JustHoop HQ",
    },
  });

  await prisma.playerRating.createMany({
    data: [
      { userId: yisen.id, mode: MatchType.ONE_V_ONE, rating: 1218, wins: 18, losses: 12, streak: 3, pointsFor: 642, pointsAgainst: 598 },
      { userId: yisen.id, mode: MatchType.THREE_V_THREE, rating: 1152, wins: 12, losses: 9, streak: 1, pointsFor: 798, pointsAgainst: 744 },
      { userId: xiaoyu.id, mode: MatchType.ONE_V_ONE, rating: 1094, wins: 10, losses: 10, streak: -1, pointsFor: 421, pointsAgainst: 432 },
      { userId: xiaoyu.id, mode: MatchType.THREE_V_THREE, rating: 1032, wins: 8, losses: 11, streak: 0, pointsFor: 654, pointsAgainst: 682 },
      { userId: hao.id, mode: MatchType.ONE_V_ONE, rating: 1376, wins: 29, losses: 16, streak: 5, pointsFor: 981, pointsAgainst: 872 },
      { userId: hao.id, mode: MatchType.THREE_V_THREE, rating: 1288, wins: 20, losses: 13, streak: 2, pointsFor: 1104, pointsAgainst: 1002 },
      { userId: chen.id, mode: MatchType.ONE_V_ONE, rating: 1260, wins: 19, losses: 13, streak: 1, pointsFor: 690, pointsAgainst: 651 },
      { userId: chen.id, mode: MatchType.THREE_V_THREE, rating: 1324, wins: 23, losses: 12, streak: 4, pointsFor: 1246, pointsAgainst: 1117 },
      { userId: lin.id, mode: MatchType.ONE_V_ONE, rating: 988, wins: 6, losses: 12, streak: -2, pointsFor: 334, pointsAgainst: 390 },
      { userId: lin.id, mode: MatchType.THREE_V_THREE, rating: 1108, wins: 11, losses: 10, streak: 1, pointsFor: 702, pointsAgainst: 690 },
    ],
  });

  const nextRanked = await prisma.match.create({
    data: {
      code: "JH-R101",
      title: "黄金段位 1V1 夜场",
      mode: MatchMode.RANKED,
      type: MatchType.ONE_V_ONE,
      status: MatchStatus.SCHEDULED,
      court: "五棵松 3 号场",
      city: "北京",
      district: "海淀",
      gym: "五棵松",
      timeSlot: "NIGHT",
      ratingMin: 1100,
      ratingMax: 1350,
      scheduledAt: minutesFromNow(42),
      livestreamUrl: "https://live.example.com/justhoop-r101",
      teamAScore: 0,
      teamBScore: 0,
      maxPlayers: 2,
      buyInCents: 1200,
      paymentStatus: PaymentStatus.PAID,
      refereeId: referee.id,
      createdById: yisen.id,
      players: {
        create: [
          { userId: yisen.id, team: "A", slot: 1, checkedIn: true, paid: true },
          { userId: hao.id, team: "B", slot: 1, checkedIn: false, paid: true },
        ],
      },
    },
  });

  const openCasual = await prisma.match.create({
    data: {
      code: "JH-M220",
      title: "下班后 3V3 快速匹配",
      mode: MatchMode.CASUAL,
      type: MatchType.THREE_V_THREE,
      status: MatchStatus.OPEN,
      court: "朝阳公园北场",
      city: "北京",
      district: "朝阳",
      gym: "朝阳公园",
      timeSlot: "EVENING",
      skillLevel: "INTERMEDIATE",
      scheduledAt: minutesFromNow(75),
      maxPlayers: 6,
      createdById: xiaoyu.id,
      players: {
        create: [
          { userId: xiaoyu.id, team: "A", slot: 1 },
          { userId: chen.id, team: "B", slot: 1 },
          { userId: lin.id, team: "A", slot: 2 },
        ],
      },
    },
  });

  const openRanked = await prisma.match.create({
    data: {
      code: "JH-R330",
      title: "铂金冲分 3V3",
      mode: MatchMode.RANKED,
      type: MatchType.THREE_V_THREE,
      status: MatchStatus.OPEN,
      court: "东单中心场",
      city: "北京",
      district: "东城",
      gym: "东单",
      timeSlot: "NIGHT",
      ratingMin: 1200,
      ratingMax: 1450,
      scheduledAt: minutesFromNow(130),
      maxPlayers: 6,
      buyInCents: 1800,
      paymentStatus: PaymentStatus.PENDING,
      refereeId: referee.id,
      createdById: hao.id,
      players: {
        create: [
          { userId: hao.id, team: "A", slot: 1, paid: true },
          { userId: chen.id, team: "B", slot: 1, paid: true },
          { userId: xiaoyu.id, team: "A", slot: 2, paid: true },
        ],
      },
    },
  });

  const liveMatch = await prisma.match.create({
    data: {
      code: "JH-L909",
      title: "远程执裁示范赛",
      mode: MatchMode.RANKED,
      type: MatchType.ONE_V_ONE,
      status: MatchStatus.LIVE,
      court: "静安体育中心 A 场",
      city: "上海",
      district: "静安",
      gym: "静安体育中心",
      timeSlot: "EVENING",
      ratingMin: 900,
      ratingMax: 1250,
      scheduledAt: minutesFromNow(-10),
      livestreamUrl: "https://live.example.com/justhoop-l909",
      teamAScore: 9,
      teamBScore: 7,
      maxPlayers: 2,
      paymentStatus: PaymentStatus.PAID,
      refereeId: referee.id,
      createdById: chen.id,
      players: {
        create: [
          { userId: chen.id, team: "A", slot: 1, checkedIn: true, paid: true },
          { userId: lin.id, team: "B", slot: 1, checkedIn: true, paid: true },
        ],
      },
    },
  });

  const finished = await prisma.match.create({
    data: {
      code: "JH-F512",
      title: "午间 1V1 排位",
      mode: MatchMode.RANKED,
      type: MatchType.ONE_V_ONE,
      status: MatchStatus.FINISHED,
      court: "滨江篮球公园",
      city: "上海",
      district: "浦东",
      gym: "滨江篮球公园",
      timeSlot: "AFTERNOON",
      ratingMin: 1100,
      ratingMax: 1400,
      scheduledAt: minutesFromNow(-220),
      livestreamUrl: "https://live.example.com/justhoop-f512",
      teamAScore: 21,
      teamBScore: 17,
      winnerTeam: "A",
      maxPlayers: 2,
      paymentStatus: PaymentStatus.PAID,
      refereeId: referee.id,
      createdById: hao.id,
      players: {
        create: [
          { userId: hao.id, team: "A", slot: 1, checkedIn: true, paid: true },
          { userId: yisen.id, team: "B", slot: 1, checkedIn: true, paid: true },
        ],
      },
    },
  });

  await prisma.payment.createMany({
    data: [
      { matchId: nextRanked.id, userId: yisen.id, amount: 1200, status: PaymentStatus.PAID },
      { matchId: nextRanked.id, userId: hao.id, amount: 1200, status: PaymentStatus.PAID },
      { matchId: openRanked.id, userId: hao.id, amount: 1800, status: PaymentStatus.PAID },
      { matchId: openRanked.id, userId: chen.id, amount: 1800, status: PaymentStatus.PAID },
      { matchId: openRanked.id, userId: xiaoyu.id, amount: 1800, status: PaymentStatus.MANUAL_REVIEW, screenshotUrl: "/payment-proof-demo.svg" },
      { matchId: liveMatch.id, userId: chen.id, amount: 1200, status: PaymentStatus.PAID },
      { matchId: liveMatch.id, userId: lin.id, amount: 1200, status: PaymentStatus.PAID },
    ],
  });

  await prisma.refereeEvent.createMany({
    data: [
      { matchId: nextRanked.id, actorId: referee.id, type: "PRE_CHECK", note: "已确认直播链接和双方人员" },
      { matchId: openCasual.id, actorId: xiaoyu.id, type: "JOIN", note: "房间创建成功" },
      { matchId: openRanked.id, actorId: hao.id, type: "PAYMENT", note: "排位保证金已锁定 2/6" },
      { matchId: liveMatch.id, actorId: referee.id, type: "START", note: "比赛开始" },
      { matchId: liveMatch.id, actorId: referee.id, type: "SCORE", team: "A", points: 2, note: "陈队中距离命中" },
      { matchId: liveMatch.id, actorId: referee.id, type: "SCORE", team: "B", points: 3, note: "林风弧顶三分" },
      { matchId: finished.id, actorId: referee.id, type: "END", note: "比赛结束，等待双方确认" },
    ],
  });

  await prisma.dispute.create({
    data: {
      matchId: finished.id,
      creatorId: yisen.id,
      reason: "最后一次进攻是否踩线需要复核",
      status: "OPEN",
    },
  });

  await prisma.refereeApplication.createMany({
    data: [
      {
        userId: xiaoyu.id,
        realName: "李晓宇",
        phone: xiaoyu.phone,
        city: "北京",
        basketballExperience: "校队 4 年，长期参加城市业余联赛。",
        refereeExperience: "为社区和公司联赛执裁约 20 场。",
        hasCertificate: true,
        certificateUrl: "/referee-certificate-demo.svg",
        availableTimes: "工作日晚间、周末全天",
        introduction: "熟悉 1V1 与 3V3 规则，希望参与平台远程执裁。",
        status: "PENDING",
      },
      {
        userId: referee.id,
        realName: "周明",
        phone: referee.phone,
        city: "北京",
        basketballExperience: "篮球爱好者 10 年。",
        refereeExperience: "区级联赛与校园联赛执裁 80 余场。",
        hasCertificate: true,
        certificateUrl: "/referee-certificate-demo.svg",
        availableTimes: "周一至周五晚间",
        introduction: "擅长远程判罚和赛后事件复盘。",
        status: "APPROVED",
        adminNote: "资历完整，已通过历史审核。",
        reviewedById: admin.id,
        reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.violationRecord.create({
    data: {
      userId: lin.id,
      reason: "一次比赛迟到超过 15 分钟",
      creditDelta: -6,
      matchId: finished.id,
      createdById: admin.id,
    },
  });

  await prisma.adminLog.createMany({
    data: [
      {
        adminId: admin.id,
        action: "APPROVE_REFEREE_APPLICATION",
        targetType: "referee_application",
        targetId: referee.id,
        note: "历史裁判账号资料补录",
      },
      {
        adminId: admin.id,
        action: "ADJUST_USER_CREDIT",
        targetType: "user",
        targetId: lin.id,
        note: "比赛迟到，信用分 -6",
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
