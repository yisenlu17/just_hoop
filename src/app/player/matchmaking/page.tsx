import { AppShell } from "@/components/AppShell";
import { MatchmakingFlow } from "@/components/MatchmakingFlow";
import { getCurrentUser } from "@/lib/auth";

export default async function MatchmakingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ mode }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const initialMode = mode === "RANKED" ? "RANKED" : "CASUAL";

  return (
    <AppShell user={user} active="大厅">
      <MatchmakingFlow initialMode={initialMode} />
    </AppShell>
  );
}
