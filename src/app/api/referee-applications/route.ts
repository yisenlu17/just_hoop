import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const applicationSchema = z.object({
  realName: z.string().trim().min(2).max(40),
  phone: z.string().trim().min(6).max(30),
  city: z.string().trim().min(2).max(40),
  basketballExperience: z.string().trim().min(10).max(2000),
  refereeExperience: z.string().trim().min(5).max(2000),
  hasCertificate: z.union([z.literal("true"), z.literal(true)]).optional(),
  certificateUrl: z.string().trim().url().or(z.literal("")).optional(),
  availableTimes: z.string().trim().min(2).max(500),
  introduction: z.string().trim().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "请先登录正常状态的用户账号" }, { status: 401 });
  }
  if (user.isReferee) {
    return NextResponse.json({ error: "你已经拥有裁判权限" }, { status: 409 });
  }
  const parsed = applicationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "申请信息不完整" }, { status: 400 });
  }
  const existing = await prisma.refereeApplication.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "你已有待审核的裁判申请" }, { status: 409 });
  }
  const input = parsed.data;
  const application = await prisma.refereeApplication.create({
    data: {
      userId: user.id,
      realName: input.realName,
      phone: input.phone,
      city: input.city,
      basketballExperience: input.basketballExperience,
      refereeExperience: input.refereeExperience,
      hasCertificate: input.hasCertificate === true || input.hasCertificate === "true",
      certificateUrl: input.certificateUrl || null,
      availableTimes: input.availableTimes,
      introduction: input.introduction,
    },
  });
  return NextResponse.json({ id: application.id });
}
