import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { getBracketStages, type MatchWithTeams } from "@/lib/tournament";
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
          <Link href={`/matches/${match.id}`} aria-label="Open match">
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
  const stages = await getBracketStages();
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
