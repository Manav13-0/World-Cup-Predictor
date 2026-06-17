import { AdminActions } from "@/components/admin-actions";
import { AnimatedCounter } from "@/components/animated-counter";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [users, matches, leagues, predictions] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.league.count(),
    prisma.prediction.count()
  ]);

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
