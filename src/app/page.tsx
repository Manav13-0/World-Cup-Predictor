import Link from "next/link";
import { ArrowRight, Flame, Medal, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { AnimatedCounter } from "@/components/animated-counter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TiltCard } from "@/components/tilt-card";

export default async function HomePage() {
  const [matches, leaderboard, stats] = await Promise.all([
    prisma.match.findMany({
      where: { kickoff: { gte: new Date() } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" },
      take: 3
    }),
    getLeaderboard(5),
    Promise.all([prisma.user.count(), prisma.prediction.count(), prisma.league.count()])
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-white/10 bg-card/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-100">
            <Sparkles size={12} />
            FIFA World Cup 2026
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Predict every result with a world-class fantasy experience.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Create leagues, lock in scores before kickoff, track form, and watch leaderboards update as results land with cinematic motion and premium visuals.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/matches">
                Start Predicting <ArrowRight size={18} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Prediction engine", value: "Winner plus exact score scoring" },
              { icon: Users, label: "Private leagues", value: "Invite friends with a shareable code" },
              { icon: Medal, label: "Live rankings", value: "Cached global and league tables" }
            ].map((item) => (
              <TiltCard key={item.label} className="h-full">
                <Card className="h-full bg-card/80">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-[0_18px_40px_rgba(0,156,222,0.22)]">
                      <item.icon size={22} />
                    </span>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <TiltCard>
            <Card className="bg-card/80">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Platform health</p>
                    <h2 className="mt-2 text-2xl font-semibold">Live engagement overview</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                    <Flame size={12} className="inline-block" /> Live
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Players", stats[0]],
                    ["Predictions", stats[1]],
                    ["Leagues", stats[2]]
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-2xl border border-white/10 bg-card/75 p-4">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="mt-2 text-3xl font-semibold">
                        <AnimatedCounter value={Number(value)} />
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TiltCard>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Current Leaders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rank}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right">{row.totalPoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Upcoming Fixtures</h2>
            <Button asChild variant="ghost">
              <Link href="/matches">All Matches</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
