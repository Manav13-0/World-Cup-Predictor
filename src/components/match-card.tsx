import Image from "next/image";
import Link from "next/link";
import { Match, Team } from "@prisma/client";
import { CalendarClock, Circle, MapPin, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKickoff } from "@/lib/utils";
import { matchStatusLabel } from "@/lib/utils";
import { TiltCard } from "@/components/tilt-card";

type MatchWithTeams = Match & {
  homeTeam: Team;
  awayTeam: Team;
};

export function MatchCard({ match }: { match: MatchWithTeams }) {
  const live = match.status === "LIVE";
  const finished = match.status === "FINISHED";

  return (
    <TiltCard className="h-full">
      <Card className="h-full overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-gradient-to-r from-white/[0.08] to-transparent">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">World Cup Fixture</p>
              <CardTitle className="text-base">{match.round ?? "World Cup Match"}</CardTitle>
            </div>
            <Badge
              className={
                live
                  ? "border-violet-400/20 bg-violet-400/15 text-violet-100"
                  : finished
                    ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-100"
                    : "border-amber-400/20 bg-amber-400/15 text-amber-100"
              }
            >
              <Circle className={live ? "fill-violet-300 text-violet-300 animate-pulse" : "fill-current"} size={8} />
              {matchStatusLabel(match.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
            <TeamIdentity team={match.homeTeam} align="right" />
            <div className="mx-auto min-w-[92px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.05] px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:mx-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Score</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
              </div>
            </div>
            <TeamIdentity team={match.awayTeam} />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarClock size={16} />
              {formatKickoff(match.kickoff)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={16} />
              {[match.stadium, match.city].filter(Boolean).join(", ") || "Venue TBC"}
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href={`/matches/${match.id}`} prefetch={false}>
              Open Match
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </TiltCard>
  );
}

function TeamIdentity({ team, align = "left" }: { team: Team; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "min-w-0 text-right" : "min-w-0"}>
      <div className="flex min-w-0 items-center gap-2" style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        {team.flag ? (
          <Image src={team.flag} alt={team.name} width={28} height={28} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/20" />
        ) : null}
        <div className={align === "right" ? "min-w-0" : "min-w-0"}>
          <span className="block break-words text-sm font-medium leading-tight sm:text-base">{team.shortName ?? team.name}</span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{team.code ?? "Team"}</span>
        </div>
      </div>
    </div>
  );
}
