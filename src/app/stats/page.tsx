import Image from "next/image";
import Link from "next/link";
import { BarChart3, ChevronLeft, ChevronRight, Shield, Sparkles, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageShell } from "@/components/page-shell";
import { getWorldCupStats, type TeamStats } from "@/lib/world-cup-stats";
import { formatKickoff } from "@/lib/utils";

const PLAYER_PAGE_SIZE = 5;
const TEAM_PAGE_SIZE = 8;

function TeamBadge({ team }: { team: TeamStats["team"] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {team.flag ? (
        <Image src={team.flag} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold">{team.name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{team.code ?? "WC"}</p>
      </div>
    </div>
  );
}

function pageNumber(value: string | undefined) {
  return Math.max(Number(value ?? 1) || 1, 1);
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    start,
    page: safePage,
    totalPages
  };
}

function statsHref(params: { scorerPage: number; assistPage: number; teamPage: number }) {
  const searchParams = new URLSearchParams();
  if (params.scorerPage > 1) searchParams.set("scorerPage", String(params.scorerPage));
  if (params.assistPage > 1) searchParams.set("assistPage", String(params.assistPage));
  if (params.teamPage > 1) searchParams.set("teamPage", String(params.teamPage));
  const query = searchParams.toString();
  return query ? `/stats?${query}` : "/stats";
}

function PaginationControls({
  label,
  page,
  totalPages,
  previousHref,
  nextHref
}: {
  label: string;
  page: number;
  totalPages: number;
  previousHref: string;
  nextHref: string;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
      <p className="text-xs text-muted-foreground">
        {label} page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
          <Link
            href={previousHref}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-45" : undefined}
          >
            <ChevronLeft size={15} />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
          <Link
            href={nextHref}
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none opacity-45" : undefined}
          >
            <ChevronRight size={15} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function PlayerRows({
  players,
  start,
  metric
}: {
  players: Awaited<ReturnType<typeof getWorldCupStats>>["topScorers"];
  start: number;
  metric: "goals" | "assists";
}) {
  return (
    <div className="grid gap-3">
      {players.map((scorer, index) => (
        <div
          key={`${metric}-${scorer.id}`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/10 text-sm font-semibold">
              {start + index + 1}
            </span>
            {scorer.team.crest ? (
              <Image src={scorer.team.crest} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate font-semibold">{scorer.name}</p>
              <p className="truncate text-xs text-muted-foreground">{scorer.team.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold">{scorer[metric]}</p>
            <p className="text-xs text-muted-foreground">{metric}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordCard({
  title,
  value,
  detail,
  icon: Icon
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Trophy;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{title}</p>
          <p className="mt-2 break-words text-2xl font-semibold">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-amber-100">
          <Icon size={20} />
        </span>
      </CardContent>
    </Card>
  );
}

function matchTitle(match: Awaited<ReturnType<typeof getWorldCupStats>>["records"]["highestScoringMatch"]) {
  if (!match) return "No finished matches yet";
  return `${match.homeTeam.name} ${match.homeScore ?? "-"}-${match.awayScore ?? "-"} ${match.awayTeam.name}`;
}

export default async function StatsPage({
  searchParams
}: {
  searchParams: Promise<{ scorerPage?: string; assistPage?: string; teamPage?: string }>;
}) {
  const params = await searchParams;
  const stats = await getWorldCupStats();
  const scorerPage = pageNumber(params.scorerPage);
  const assistPage = pageNumber(params.assistPage);
  const teamPage = pageNumber(params.teamPage);
  const topScorers = paginate(stats.topScorers, scorerPage, PLAYER_PAGE_SIZE);
  const topAssists = paginate(stats.topAssists, assistPage, PLAYER_PAGE_SIZE);
  const teams = paginate(stats.teams, teamPage, TEAM_PAGE_SIZE);

  return (
    <PageShell
      title="World Cup Stats"
      description="Goals, records, player scorers, and team performance from the 2026 tournament data."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: "Goals", value: stats.summary.totalGoals, icon: Target },
          { label: "Finished", value: stats.summary.finishedMatches, icon: Trophy },
          { label: "Fixtures", value: stats.summary.totalMatches, icon: BarChart3 },
          { label: "Goals / match", value: stats.summary.goalsPerMatch.toFixed(2), icon: Sparkles }
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold">{item.value}</p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-amber-100">
                <item.icon size={19} />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <RecordCard
          title="Highest scoring"
          value={matchTitle(stats.records.highestScoringMatch)}
          detail={
            stats.records.highestScoringMatch
              ? formatKickoff(stats.records.highestScoringMatch.kickoff)
              : "Sync results as matches finish."
          }
          icon={Target}
        />
        <RecordCard
          title="Biggest win"
          value={matchTitle(stats.records.biggestWin)}
          detail={
            stats.records.biggestWin
              ? `${Math.abs((stats.records.biggestWin.homeScore ?? 0) - (stats.records.biggestWin.awayScore ?? 0))} goal margin`
              : "No finished match record yet."
          }
          icon={Trophy}
        />
        <RecordCard
          title="Best defense"
          value={stats.records.bestDefense?.team.name ?? "No team yet"}
          detail={
            stats.records.bestDefense
              ? `${stats.records.bestDefense.goalsAgainst} conceded, ${stats.records.bestDefense.cleanSheets} clean sheets`
              : "Defensive records appear after results sync."
          }
          icon={Shield}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Players</p>
              <CardTitle className="mt-2">Top scorers</CardTitle>
            </div>
            <Badge className="border-amber-300/20 bg-amber-400/10 text-amber-100">Football-data</Badge>
          </CardHeader>
          <CardContent>
            {stats.topScorers.length ? (
              <>
                <PlayerRows players={topScorers.items} start={topScorers.start} metric="goals" />
                <PaginationControls
                  label="Scorers"
                  page={topScorers.page}
                  totalPages={topScorers.totalPages}
                  previousHref={statsHref({ scorerPage: topScorers.page - 1, assistPage: topAssists.page, teamPage: teams.page })}
                  nextHref={statsHref({ scorerPage: topScorers.page + 1, assistPage: topAssists.page, teamPage: teams.page })}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm leading-6 text-muted-foreground">
                Player scoring data is not available yet. Team and match records will keep updating from your synced fixtures.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Creators</p>
              <CardTitle className="mt-2">Most assists</CardTitle>
            </div>
            <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-100">Playmakers</Badge>
          </CardHeader>
          <CardContent>
            {stats.topAssists.length ? (
              <>
                <PlayerRows players={topAssists.items} start={topAssists.start} metric="assists" />
                <PaginationControls
                  label="Assists"
                  page={topAssists.page}
                  totalPages={topAssists.totalPages}
                  previousHref={statsHref({ scorerPage: topScorers.page, assistPage: topAssists.page - 1, teamPage: teams.page })}
                  nextHref={statsHref({ scorerPage: topScorers.page, assistPage: topAssists.page + 1, teamPage: teams.page })}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm leading-6 text-muted-foreground">
                Assist data is not available yet. This will appear automatically when football-data publishes assist totals.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Teams</p>
              <CardTitle className="mt-2">Team statistics</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/standings">View standings</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40 px-2 sm:px-4">Team</TableHead>
                    <TableHead className="px-2 text-center sm:px-4">P</TableHead>
                    <TableHead className="px-2 text-center sm:px-4">GF</TableHead>
                    <TableHead className="px-2 text-center sm:px-4">GA</TableHead>
                    <TableHead className="px-2 text-center sm:px-4">GD</TableHead>
                    <TableHead className="px-2 text-center sm:px-4">CS</TableHead>
                    <TableHead className="px-2 text-center sm:px-4">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.items.map((team) => (
                    <TableRow key={team.team.id}>
                      <TableCell className="px-2 py-3 sm:p-4">
                        <TeamBadge team={team.team} />
                      </TableCell>
                      <TableCell className="px-2 text-center sm:p-4">{team.played}</TableCell>
                      <TableCell className="px-2 text-center sm:p-4">{team.goalsFor}</TableCell>
                      <TableCell className="px-2 text-center sm:p-4">{team.goalsAgainst}</TableCell>
                      <TableCell className="px-2 text-center sm:p-4">{team.goalDifference}</TableCell>
                      <TableCell className="px-2 text-center sm:p-4">{team.cleanSheets}</TableCell>
                      <TableCell className="px-2 text-center font-semibold sm:p-4">{team.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              label="Teams"
              page={teams.page}
              totalPages={teams.totalPages}
              previousHref={statsHref({ scorerPage: topScorers.page, assistPage: topAssists.page, teamPage: teams.page - 1 })}
              nextHref={statsHref({ scorerPage: topScorers.page, assistPage: topAssists.page, teamPage: teams.page + 1 })}
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
