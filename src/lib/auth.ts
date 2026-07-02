import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE = "justhoop_user";

async function getCookieUser() {
  const cookieStore = await cookies();
  const currentId = cookieStore.get(AUTH_COOKIE)?.value;
  return currentId
    ? await prisma.user.findUnique({
        where: { id: currentId },
        include: { ratings: true },
      })
    : null;
}

export async function getAuthenticatedUser() {
  return getCookieUser();
}

export async function getCurrentUser() {
  const user = await getCookieUser();

  if (user) return user;

  return prisma.user.findFirst({
    where: { role: "PLAYER" },
    include: { ratings: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("缺少测试账号，请先初始化数据库。");
  }
  return user;
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user || !user.isAdmin || user.status !== "ACTIVE") {
    return null;
  }
  return user;
}

export async function requireReferee() {
  const user = await getAuthenticatedUser();
  if (
    !user ||
    user.status !== "ACTIVE" ||
    (!user.isReferee && !user.isAdmin)
  ) {
    return null;
  }
  return user;
}
