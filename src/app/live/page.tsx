import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowUpRight, CalendarClock, Circle, Clock, Radio, Trophy } from "lucide-react";
import { Match, MatchStatus, Team } from "@prisma/client";
import { PageShell } from "@/components/page-shell";
import { MatchClock } from "@/components/match-clock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatKickoff, matchStatusLabel } from "@/lib/utils";

type MatchWithTeams = Match & {
  homeTeam: Team;
  awayTeam: Team;
};

type FeedEvent = {
  id: string;
  matchId: string;
  type: string;
  detail: string;
  teamName: string | null;
  playerName: string | null;
  minute: number | null;
  happenedAt: Date | null;
  createdAt: Date;
};

async function getRecentEvents() {
  const matchEvent = (prisma as any).matchEvent;
  if (!matchEvent?.findMany) return [];

  const events = (await matchEvent.findMany({
    orderBy: [{ happenedAt: "desc" }, { createdAt: "desc" }],
    take: 12
  })) as FeedEvent[];

  if (!events.length) return [];

  const matches = await prisma.match.findMany({
    where: { id: { in: Array.from(new Set(events.map((event) => event.matchId))) } },
    include: { homeTeam: true, awayTeam: true }
  });
  const matchById = new Map(matches.map((match) => [match.id, match]));

  return events.map((event) => ({
    event,
    match: matchById.get(event.matchId) ?? null
  }));
}

export default async function LivePage() {
  const now = new Date();
  const [liveMatches, upcomingMatches, recentFinishedMatches, recentEvents] = await Promise.all([
    prisma.match.findMany({
      where: { status: "LIVE" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" }
    }),
    prisma.match.findMany({
      where: { status: "SCHEDULED", kickoff: { gte: now } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" },
      take: 6
    }),
    prisma.match.findMany({
      where: { status: "FINISHED" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { updatedAt: "desc" },
      take: 4
    }),
    getRecentEvents()
  ]);

  const featuredMatches = liveMatches.length ? liveMatches : upcomingMatches.slice(0, 3);

  return (
    <PageShell
      title="Live Match Center"
      description="Follow live scores, match events, and the next fixtures updated by the background sync worker."
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatusMetric label="Live now" value={liveMatches.length} icon={<Radio size={18} />} tone="live" />
        <StatusMetric label="Next up" value={upcomingMatches.length} icon={<Clock size={18} />} tone="scheduled" />
        <StatusMetric label="Recently finished" value={recentFinishedMatches.length} icon={<Trophy size={18} />} tone="finished" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                {liveMatches.length ? "Live Fixtures" : "No Live Fixtures"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {liveMatches.length ? "Matches in progress" : "Next matches to watch"}
              </h2>
            </div>
            <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
              <Circle className="fill-emerald-300 text-emerald-300" size={8} />
              Socket ready
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {featuredMatches.length ? (
              featuredMatches.map((match) => <LiveMatchCard key={match.id} match={match} prominent={match.status === "LIVE"} />)
            ) : (
              <EmptyState />
            )}
          </div>

          {recentFinishedMatches.length ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Latest results</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/matches?status=FINISHED" prefetch={false}>
                    View all
                    <ArrowUpRight size={15} />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {recentFinishedMatches.map((match) => (
                  <CompactMatchRow key={match.id} match={match} />
                ))}
              </div>
            </section>
          ) : null}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Event Feed</CardTitle>
                <Activity className="text-emerald-200" size={18} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEvents.length ? (
                recentEvents.map(({ event, match }) => (
                  <EventRow key={event.id} event={event} match={match} />
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-muted-foreground">
                  Live goals, cards, and status events will appear here as the worker syncs matches.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMatches.slice(0, 4).map((match) => (
                <CompactMatchRow key={match.id} match={match} />
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}

function StatusMetric({
  label,
  value,
  icon,
  tone
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "live" | "scheduled" | "finished";
}) {
  const toneClass =
    tone === "live"
      ? "text-emerald-100 bg-emerald-400/10 border-emerald-300/20"
      : tone === "finished"
        ? "text-amber-100 bg-amber-400/10 border-amber-300/20"
        : "text-violet-100 bg-violet-400/10 border-violet-300/20";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl border ${toneClass}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function LiveMatchCard({ match, prominent }: { match: MatchWithTeams; prominent?: boolean }) {
  return (
    <Card className={prominent ? "border-emerald-300/20 bg-emerald-400/[0.05]" : undefined}>
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{match.round ?? "World Cup"}</p>
            <CardTitle className="mt-2 text-lg">{matchStatusLabel(match.status)}</CardTitle>
          </div>
          <StatusBadge status={match.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamBlock team={match.homeTeam} align="right" />
          <div className="min-w-[92px] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Score</p>
            <p className="mt-1 text-3xl font-semibold">
              {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
            </p>
          </div>
          <TeamBlock team={match.awayTeam} />
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <MatchClock kickoff={match.kickoff} status={match.status} compact className="w-full justify-center" />
          <p className="flex items-center gap-2">
            <CalendarClock size={16} />
            {formatKickoff(match.kickoff)}
          </p>
          <p>{[match.stadium, match.city].filter(Boolean).join(", ") || "Venue TBC"}</p>
        </div>
        <Button asChild className="w-full">
          <Link href={`/matches/${match.id}`} prefetch={false}>
            Open Match
            <ArrowUpRight size={16} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function CompactMatchRow({ match }: { match: MatchWithTeams }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      prefetch={false}
      className="block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{formatKickoff(match.kickoff)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold">
            {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
          </p>
          <p className="text-xs text-muted-foreground">{matchStatusLabel(match.status)}</p>
        </div>
      </div>
    </Link>
  );
}

function EventRow({ event, match }: { event: FeedEvent; match: MatchWithTeams | null }) {
  const time = event.happenedAt ?? event.createdAt;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between gap-3">
        <Badge className="border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.24em]">{event.minute !== null ? `${event.minute}'` : event.type}</Badge>
        <p className="text-xs text-muted-foreground">{formatKickoff(time)}</p>
      </div>
      <p className="mt-2 text-sm font-semibold">{event.detail}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {eventMeta(event, match)}
      </p>
    </div>
  );
}

function eventMeta(event: FeedEvent, match: MatchWithTeams | null) {
  const eventPeople = [event.teamName, event.playerName].filter(Boolean).join(" - ");
  if (eventPeople) return eventPeople;
  if (match) return `${match.homeTeam.name} vs ${match.awayTeam.name}`;
  return "Live event";
}

function TeamBlock({ team, align = "left" }: { team: Team; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "min-w-0 text-right" : "min-w-0"}>
      <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
        {team.flag ? <Image src={team.flag} alt={team.name} width={30} height={30} className="h-8 w-8 shrink-0 rounded-full object-cover" /> : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">{team.shortName ?? team.name}</p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{team.code ?? "Team"}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MatchStatus }) {
  const live = status === "LIVE";
  const finished = status === "FINISHED";
  return (
    <Badge
      className={
        live
          ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-100"
          : finished
            ? "border-amber-400/20 bg-amber-400/15 text-amber-100"
            : "border-violet-400/20 bg-violet-400/15 text-violet-100"
      }
    >
      <Circle className={live ? "fill-emerald-300 text-emerald-300 animate-pulse" : "fill-current"} size={8} />
      {matchStatusLabel(status)}
    </Badge>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center lg:col-span-2">
      <Radio className="mx-auto text-muted-foreground" size={28} />
      <h2 className="mt-4 text-xl font-semibold">No fixtures available yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Once fixtures are synced, this page will show live matches first and the next watchlist after that.
      </p>
    </div>
  );
}
