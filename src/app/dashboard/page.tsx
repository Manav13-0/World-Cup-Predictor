import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRank } from "@/lib/leaderboard";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/components/performance-chart";
import { redirect } from "next/navigation";

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

  const [predictions, rank] = await Promise.all([
    prisma.prediction.findMany({ where: { userId }, include: { match: true }, orderBy: { createdAt: "asc" } }),
    getUserRank(userId)
  ]);

  const correct = predictions.filter((prediction) => prediction.isCorrect).length;
  const finished = predictions.filter((prediction) => prediction.match.status === "FINISHED").length;
  const points = predictions.reduce((sum, prediction) => sum + prediction.points, 0);
  const chart = predictions.slice(-8).map((prediction, index) => ({
    label: `P${index + 1}`,
    points: prediction.points
  }));

  return (
    <PageShell title="Dashboard" description="Your prediction form, score, and current rank.">
      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Total Predictions", predictions.length],
          ["Correct", correct],
          ["Wrong", finished - correct],
          ["Points", points],
          ["Rank", rank ?? "-"]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={chart.length ? chart : [{ label: "Start", points: 0 }]} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
