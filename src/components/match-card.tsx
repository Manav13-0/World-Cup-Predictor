import Image from "next/image";
import Link from "next/link";
import { Match, Team } from "@prisma/client";
import { CalendarClock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKickoff } from "@/lib/utils";

type MatchWithTeams = Match & {
  homeTeam: Team;
  awayTeam: Team;
};

export function MatchCard({ match }: { match: MatchWithTeams }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/35">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{match.round ?? "World Cup Match"}</CardTitle>
          <Badge>{match.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamIdentity team={match.homeTeam} align="right" />
          <div className="rounded-md bg-background px-3 py-2 text-center font-semibold">
            {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
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
          <Link href={`/matches/${match.id}`}>Open Match</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamIdentity({ team, align = "left" }: { team: Team; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className="flex items-center gap-2" style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        {team.flag ? (
          <Image src={team.flag} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
        ) : null}
        <span className="font-medium">{team.shortName ?? team.name}</span>
      </div>
    </div>
  );
}
