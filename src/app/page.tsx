import Link from "next/link";
import { ArrowRight, Medal, ShieldCheck, Users } from "lucide-react";
import { getLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <>
      <section className="border-b">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex rounded-sm border px-3 py-1 text-sm text-muted-foreground">
              FIFA World Cup 2026 Prediction League
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-normal sm:text-6xl">
              Predict every result, climb every table.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Create leagues, lock in scores before kickoff, track form, and watch leaderboards update as results land.
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
          </div>
          <div className="grid gap-4">
            {[
              { icon: ShieldCheck, label: "Prediction engine", value: "Winner plus exact score scoring" },
              { icon: Users, label: "Private leagues", value: "Invite friends with a shareable code" },
              { icon: Medal, label: "Live rankings", value: "Cached global and league tables" }
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-secondary text-secondary-foreground">
                    <item.icon size={22} />
                  </span>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Players", stats[0]],
            ["Predictions", stats[1]],
            ["Leagues", stats[2]]
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
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
        <Card>
          <CardHeader>
            <CardTitle>Current Leaders</CardTitle>
          </CardHeader>
          <CardContent>
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
      </section>
    </>
  );
}
