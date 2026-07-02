import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { userId?: string };
  if (!body.userId) {
    return NextResponse.json({ error: "缺少账号" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!user) {
    return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "该账号当前不可登录" }, { status: 403 });
  }

  const response = NextResponse.json({
    ok: true,
    role: user.role,
    isAdmin: user.isAdmin,
    isReferee: user.isReferee,
  });
  response.cookies.set(AUTH_COOKIE, user.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
