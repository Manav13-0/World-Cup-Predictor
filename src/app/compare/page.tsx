import { ArrowRightLeft, CalendarClock } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getComparisonTeams, getTeamComparisonData } from "@/lib/team-comparison";
import { formatKickoff, matchStatusLabel } from "@/lib/utils";

function statCard(label: string, value: number | string) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function ComparePage({
  searchParams
}: {
  searchParams: Promise<{ teamA?: string; teamB?: string }>;
}) {
  const params = await searchParams;
  const teams = await getComparisonTeams();

  if (!teams.length) {
    return (
      <PageShell title="Team Comparison" description="Compare two teams head-to-head.">
        <p className="text-sm text-muted-foreground">No teams available yet.</p>
      </PageShell>
    );
  }

  const teamAId = params.teamA && teams.some((team) => team.id === params.teamA) ? params.teamA : teams[0]?.id;
  const teamBDefault = teams.find((team) => team.id !== teamAId)?.id ?? teams[1]?.id ?? teamAId;
  const teamBId = params.teamB && teams.some((team) => team.id === params.teamB && team.id !== teamAId) ? params.teamB : teamBDefault;

  if (!teamAId || !teamBId) {
    return (
      <PageShell title="Team Comparison" description="Compare two teams head-to-head.">
        <p className="text-sm text-muted-foreground">Not enough teams synced yet.</p>
      </PageShell>
    );
  }

  const comparison = await getTeamComparisonData(teamAId, teamBId);

  return (
    <PageShell title="Team Comparison" description="Compare tournament form and head-to-head records.">
      <form method="get">
        <Card className="mb-6">
          <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Team A</span>
              <Select defaultValue={teamAId} name="teamA">
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </label>
            <div className="hidden h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 lg:grid">
              <ArrowRightLeft size={18} />
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Team B</span>
              <Select defaultValue={teamBId} name="teamB">
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </label>
            <Button type="submit" className="w-full lg:self-end">
              Compare Teams
            </Button>
          </CardContent>
        </Card>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{comparison.teamA.team.name}</CardTitle>
            <Badge className="w-fit border-violet-400/20 bg-violet-400/10 text-violet-100">
              {comparison.teamA.team.code ?? "WC"}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["Played", comparison.teamA.played],
              ["Wins", comparison.teamA.wins],
              ["Draws", comparison.teamA.draws],
              ["Losses", comparison.teamA.losses],
              ["Goals For", comparison.teamA.goalsFor],
              ["Goals Against", comparison.teamA.goalsAgainst],
              ["Goal Diff", comparison.teamA.goalDifference],
              ["Points", comparison.teamA.points]
            ].map(([label, value]) => (
              <div key={label as string}>{statCard(label as string, Number(value))}</div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{comparison.teamB.team.name}</CardTitle>
            <Badge className="w-fit border-violet-400/20 bg-violet-400/10 text-violet-100">
              {comparison.teamB.team.code ?? "WC"}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["Played", comparison.teamB.played],
              ["Wins", comparison.teamB.wins],
              ["Draws", comparison.teamB.draws],
              ["Losses", comparison.teamB.losses],
              ["Goals For", comparison.teamB.goalsFor],
              ["Goals Against", comparison.teamB.goalsAgainst],
              ["Goal Diff", comparison.teamB.goalDifference],
              ["Points", comparison.teamB.points]
            ].map(([label, value]) => (
              <div key={label as string}>{statCard(label as string, Number(value))}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Head-to-head</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{comparison.teamA.team.name}</p>
                <p className="mt-2 text-3xl font-semibold">{comparison.headToHead.teamAWins}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Draws</p>
                <p className="mt-2 text-3xl font-semibold">{comparison.headToHead.draws}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{comparison.teamB.team.name}</p>
                <p className="mt-2 text-3xl font-semibold">{comparison.headToHead.teamBWins}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Goals: {comparison.headToHead.goalsForA} - {comparison.headToHead.goalsForB}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent meetings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {comparison.headToHead.matches.length ? (
              comparison.headToHead.matches.map((match) => (
                <div key={match.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {match.homeTeam.name} {match.homeScore ?? "-"}:{match.awayScore ?? "-"} {match.awayTeam.name}
                    </p>
                    <Badge className="border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.3em]">
                      {matchStatusLabel(match.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={12} />
                      {formatKickoff(match.kickoff)}
                    </span>
                    {match.round ? <span>{match.round}</span> : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No head-to-head matches found yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
