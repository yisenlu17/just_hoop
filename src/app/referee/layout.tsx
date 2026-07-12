import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function RefereeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  // 被封禁/待审核的账号无法进入，也无法申请。
  if (user.status !== "ACTIVE") redirect("/unauthorized?area=referee");
  // 已登录的普通球员：引导去申请成为裁判，而不是撞无权页。
  if (!user.isReferee && !user.isAdmin) redirect("/player/referee-application");
  return children;
}
