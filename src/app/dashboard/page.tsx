import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRank } from "@/lib/leaderboard";
import { AnimatedCounter } from "@/components/animated-counter";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/components/performance-chart";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/tilt-card";
import { loadUserPredictionsWithMatches } from "@/lib/prediction-loaders";

export default async function DashboardPage() {
  const session = await auth();
  let userId = session?.user.id ?? "";

  if (!userId && session?.user.email) {
    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = dbUser?.id ?? "";
  }

  if (!userId) {
    redirect("/login");
  }

  const [predictions, rank] = await Promise.all([loadUserPredictionsWithMatches(userId, "asc"), getUserRank(userId)]);

  const correct = predictions.filter((prediction) => prediction.isCorrect).length;
  const finished = predictions.filter((prediction) => prediction.match.status === "FINISHED").length;
  const points = predictions.reduce((sum, prediction) => sum + prediction.points, 0);
  const chart = predictions.slice(-8).map((prediction, index) => ({
    label: `P${index + 1}`,
    points: prediction.points
  }));

  return (
    <PageShell title="Dashboard" description="Your prediction form, score, and current rank.">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <TiltCard>
          <Card className="h-full bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Your Profile</p>
                  <CardTitle className="mt-2 text-2xl">Prediction cockpit</CardTitle>
                </div>
                <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-100">Rank #{rank ?? "-"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Total Predictions", predictions.length],
                  ["Correct", correct],
                  ["Wrong", finished - correct],
                  ["Points", points],
                  ["Rank", rank ?? "-"]
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/75 p-4"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TiltCard>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Recent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={chart.length ? chart : [{ label: "Start", points: 0 }]} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 bg-card/80">
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {predictions.slice(-6).map((prediction) => (
            <div key={prediction.id} className="rounded-2xl border border-white/10 bg-card/75 p-4">
              <p className="font-medium">
                {prediction.match.homeTeam.name} vs {prediction.match.awayTeam.name}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {prediction.predictedHomeScore}-{prediction.predictedAwayScore} • {prediction.points} pts
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
