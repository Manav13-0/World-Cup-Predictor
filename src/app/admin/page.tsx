import { AdminActions } from "@/components/admin-actions";
import { AnimatedCounter } from "@/components/animated-counter";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminAnalytics } from "@/lib/admin-analytics";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [users, matches, leagues, predictions] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.league.count(),
    prisma.prediction.count()
  ]);
  const analytics = await getAdminAnalytics();

  return (
    <PageShell title="Admin Panel" description="Synchronize fixtures and monitor platform activity.">
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Users", users],
          ["Matches", matches],
          ["Leagues", leagues],
          ["Predictions", predictions]
        ].map(([label, value]) => (
          <TiltCard key={label as string} className="h-full">
            <Card className="h-full">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">
                  <AnimatedCounter value={Number(value)} />
                </p>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        {[
          ["Active leagues", analytics.counts.activeLeagues],
          ["Predictions / match", analytics.predictionsPerMatch.toFixed(1)],
          ["Finished matches", analytics.syncHealth.finishedMatches],
          ["Live matches", analytics.syncHealth.liveMatches]
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold">
                {typeof value === "number" ? <AnimatedCounter value={Number(value)} /> : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Most predicted teams</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {analytics.mostPredictedTeams.length ? (
              analytics.mostPredictedTeams.map((team, index) => (
                <div key={team.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center gap-3">
                    <Badge className="border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.3em]">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{team.code ?? "No code"}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-semibold">{team.count}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No prediction data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Health</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Scheduled", analytics.syncHealth.scheduledMatches],
              ["Finished", analytics.syncHealth.finishedMatches],
              ["Live", analytics.syncHealth.liveMatches]
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Latest update: {analytics.syncHealth.latestMatchUpdate ? analytics.syncHealth.latestMatchUpdate.updatedAt.toLocaleString() : "No sync yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminActions />
        </CardContent>
      </Card>
    </PageShell>
  );
}
