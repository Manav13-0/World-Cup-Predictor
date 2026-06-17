import { getLeaderboard } from "@/lib/leaderboard";
import { AnimatedCounter } from "@/components/animated-counter";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard(100);
  const podium = leaderboard.slice(0, 3);

  return (
    <PageShell title="Leaderboard" description="Rankings update by points, correct predictions, then earliest signup.">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {podium.map((row, index) => (
          <TiltCard key={row.id} className="h-full">
            <Card className="h-full">
              <CardContent className="p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  #{row.rank} {index === 0 ? "Top" : index === 1 ? "Silver" : "Bronze"}
                </p>
                <h3 className="mt-3 text-2xl font-semibold">{row.name}</h3>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-card/75 p-4">
                    <p className="text-muted-foreground">Correct</p>
                    <p className="mt-1 text-2xl font-semibold">
                      <AnimatedCounter value={row.correctPredictions} />
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-card/75 p-4">
                    <p className="text-muted-foreground">Points</p>
                    <p className="mt-1 text-2xl font-semibold">
                      <AnimatedCounter value={row.totalPoints} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <LeaderboardTable rows={leaderboard} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
