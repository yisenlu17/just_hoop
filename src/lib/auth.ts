import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

// 只返回真正登录（持有 cookie）的用户，未登录返回 null。
export async function getCurrentUser() {
  return getCookieUser();
}

// 页面级守卫：未登录直接跳转登录页，返回值保证非空。
export async function requirePageUser() {
  const user = await getCookieUser();
  if (!user) redirect("/login");
  return user;
}

// 裁判页守卫：未登录跳登录；已登录但非裁判/运营，引导去申请成为裁判。
export async function requireRefereePage() {
  const user = await getCookieUser();
  if (!user) redirect("/login");
  if (!user.isReferee && !user.isAdmin) redirect("/player/referee-application");
  return user;
}

// 接口级守卫：未登录抛出（由调用方转成 401）。
export async function requireCurrentUser() {
  const user = await getCookieUser();
  if (!user) {
    throw new Error("未登录");
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
