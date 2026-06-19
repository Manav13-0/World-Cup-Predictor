import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { getBracketAutomation, getBracketStages, type MatchWithTeams } from "@/lib/tournament";
import { formatKickoff, matchStatusLabel } from "@/lib/utils";

function TeamLine({ teamName, flag, score }: { teamName: string; flag?: string | null; score: number | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {flag ? (
          <Image src={flag} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="h-6 w-6 rounded-full bg-white/10" />
        )}
        <span className="truncate text-sm font-semibold">{teamName}</span>
      </div>
      <span className="text-lg font-semibold">{score ?? "-"}</span>
    </div>
  );
}

function BracketMatch({ match }: { match: MatchWithTeams }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background/35 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge className="border-amber-300/20 bg-amber-400/10 text-amber-100">{matchStatusLabel(match.status)}</Badge>
        <Button asChild size="icon" variant="ghost" className="h-8 w-8 rounded-full">
          <Link href={`/matches/${match.id}`} aria-label="Open match" prefetch={false}>
            <ArrowUpRight size={15} />
          </Link>
        </Button>
      </div>
      <div className="grid gap-2">
        <TeamLine teamName={match.homeTeam.name} flag={match.homeTeam.flag} score={match.homeScore} />
        <TeamLine teamName={match.awayTeam.name} flag={match.awayTeam.flag} score={match.awayScore} />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarClock size={14} />
          {formatKickoff(match.kickoff)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={14} />
          {match.stadium ?? match.city ?? "World Cup venue"}
        </p>
      </div>
    </div>
  );
}

export default async function BracketPage() {
  const [stages, automation] = await Promise.all([getBracketStages(), getBracketAutomation()]);
  const totalKnockoutMatches = stages.reduce((total, stage) => total + stage.matches.length, 0);
  const finalMatch = stages.find((stage) => stage.key === "FINAL")?.matches[0];

  return (
    <PageShell
      title="Tournament Bracket"
      description="Follow the knockout path from Round of 32 through the World Cup Final."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Knockout Path</p>
              <p className="mt-2 text-3xl font-semibold">{totalKnockoutMatches} matches</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="text-amber-100" size={20} />
              {finalMatch ? `${finalMatch.homeTeam.name} vs ${finalMatch.awayTeam.name}` : "Final awaits qualified teams"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Final</p>
            <p className="mt-2 text-xl font-semibold">{finalMatch ? formatKickoff(finalMatch.kickoff) : "Not synced yet"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Bracket automation</p>
            <CardTitle className="mt-2">Auto-qualified teams</CardTitle>
          </div>
          <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
            {automation.groupsReady}/{automation.totalGroups} groups ready
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Qualified teams</p>
            <div className="grid gap-3">
              {automation.qualifiers.length ? (
                automation.qualifiers.map((row) => (
                  <div key={`${row.groupKey}-${row.team.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{row.team.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{row.groupLabel}</p>
                      </div>
                      <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-100">#{row.rank}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                      {[
                        ["Pts", row.points],
                        ["GD", row.goalDifference],
                        ["GF", row.goalsFor],
                        ["W", row.wins]
                      ].map(([label, value]) => (
                        <div key={label as string} className="rounded-xl border border-white/10 bg-background/30 p-2">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="mt-1 font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No qualified teams available yet.</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Third place contenders</p>
            <div className="grid gap-3">
              {automation.thirdPlaceTeams.length ? (
                automation.thirdPlaceTeams.map((row) => (
                  <div key={`${row.groupKey}-${row.team.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{row.team.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{row.groupLabel}</p>
                      </div>
                      <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-100">3rd</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {row.points} pts · {row.goalDifference} GD · {row.goalsFor} GF
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Third-place teams will appear here after group matches finish.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Projected Round of 16</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {automation.projectedRoundOf16.length ? (
            automation.projectedRoundOf16.map((pair, index) => (
              <div key={`${pair.home.team.id}-${pair.away.team.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Match {index + 1}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <p className="font-semibold">{pair.home.team.name}</p>
                    <p className="text-xs text-muted-foreground">{pair.home.groupLabel}</p>
                  </div>
                  <div className="hidden text-center text-sm text-muted-foreground sm:block">vs</div>
                  <div className="text-right sm:text-left">
                    <p className="font-semibold">{pair.away.team.name}</p>
                    <p className="text-xs text-muted-foreground">{pair.away.groupLabel}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Projected pairings will appear once more groups are qualified.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {stages.map((stage) => (
          <Card key={stage.key}>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>{stage.label}</CardTitle>
              <Badge className="border-white/10 bg-white/5 text-muted-foreground">{stage.matches.length}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              {stage.matches.length ? (
                stage.matches.map((match) => <BracketMatch key={match.id} match={match} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-muted-foreground">
                  Awaiting synced fixtures
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
