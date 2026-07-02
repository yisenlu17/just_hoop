import { redirect } from "next/navigation";
import { requireReferee } from "@/lib/auth";

export default async function RefereeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const referee = await requireReferee();
  if (!referee) redirect("/unauthorized?area=referee");
  return children;
}
