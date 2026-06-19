import { MatchStatus, Prisma } from "@prisma/client";
import { apiFootball, type ApiFixture } from "@/lib/api-football/client";
import { footballData } from "@/lib/football-data/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { awardFinishedMatch } from "@/lib/prediction-engine/scoring";
import { emitSocketEvent } from "@/lib/socket-events";
import { shortTeamName } from "@/lib/utils";

function statusFromApi(shortStatus: string): MatchStatus {
  if (["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE", "IN_PLAY", "PAUSED"].includes(shortStatus)) {
    return "LIVE";
  }
  if (["FT", "AET", "PEN", "FINISHED", "AWARDED"].includes(shortStatus)) return "FINISHED";
  if (["CANC", "ABD", "PST", "POSTPONED", "SUSPENDED", "CANCELLED"].includes(shortStatus)) return "CANCELLED";
  return "SCHEDULED";
}

function provider() {
  if (env.FOOTBALL_DATA_API_KEY) {
    return footballData;
  }

  if (env.API_FOOTBALL_KEY) {
    return apiFootball;
  }

  throw new Error("Set FOOTBALL_DATA_API_KEY for football-data.org sync, or set API_FOOTBALL_KEY for API-Football sync.");
}

function hasTeamId(team: { id: number | null | undefined }) {
  return typeof team.id === "number" && Number.isInteger(team.id);
}

function winnerFromFixture(fixture: ApiFixture) {
  if (fixture.goals.home === null || fixture.goals.away === null) return null;
  if (fixture.goals.home > fixture.goals.away) return "HOME";
  if (fixture.goals.away > fixture.goals.home) return "AWAY";
  return "DRAW";
}

function eventFingerprint(
  matchId: string,
  source: string,
  type: string,
  minute: number | null,
  detail: string,
  teamName?: string | null,
  playerName?: string | null,
  assistName?: string | null
) {
  return [matchId, source, type, minute ?? "", detail, teamName ?? "", playerName ?? "", assistName ?? ""].join("|");
}

async function ensureTeams(fixture: ApiFixture) {
  if (!hasTeamId(fixture.teams.home) || !hasTeamId(fixture.teams.away)) {
    return null;
  }

  const [homeTeam, awayTeam] = await Promise.all([
    resolveTeam(fixture.teams.home),
    resolveTeam(fixture.teams.away)
  ]);

  if (!homeTeam || !awayTeam) return null;

  return { homeTeam, awayTeam };
}

async function resolveTeam(team: ApiFixture["teams"]["home"]) {
  if (!hasTeamId(team)) return null;

  const apiTeamId = team.id as number;
  const name = team.name ?? "TBD";
  const existing = await prisma.team.findUnique({
    where: { apiTeamId }
  });

  if (existing) {
    return existing;
  }

  return prisma.team.upsert({
    where: { apiTeamId },
    create: {
      apiTeamId,
      name,
      shortName: shortTeamName(name),
      flag: team.logo
    },
    update: {
      name,
      flag: team.logo
    }
  });
}

async function persistEvent(matchId: string, event: {
  source: string;
  type: string;
  detail: string;
  minute?: number | null;
  teamName?: string | null;
  playerName?: string | null;
  assistName?: string | null;
  period?: string | null;
  happenedAt?: Date | null;
}, options?: { broadcast?: boolean }) {
  const fingerprint = eventFingerprint(matchId, event.source, event.type, event.minute ?? null, event.detail, event.teamName, event.playerName, event.assistName);

  const matchEvent = (prisma as any).matchEvent;

  await matchEvent.upsert({
    where: { fingerprint },
    create: {
      fingerprint,
      matchId,
      source: event.source,
      type: event.type,
      detail: event.detail,
      minute: event.minute ?? null,
      teamName: event.teamName ?? null,
      playerName: event.playerName ?? null,
      assistName: event.assistName ?? null,
      period: event.period ?? null,
      happenedAt: event.happenedAt ?? null
    },
    update: {
      detail: event.detail,
      minute: event.minute ?? null,
      teamName: event.teamName ?? null,
      playerName: event.playerName ?? null,
      assistName: event.assistName ?? null,
      period: event.period ?? null,
      happenedAt: event.happenedAt ?? null
    }
  });

  if (options?.broadcast !== false) {
    await emitSocketEvent("match_event", {
      matchId,
      source: event.source,
      type: event.type,
      detail: event.detail,
      minute: event.minute ?? null,
      teamName: event.teamName ?? null,
      playerName: event.playerName ?? null,
      assistName: event.assistName ?? null,
      period: event.period ?? null,
      happenedAt: event.happenedAt?.toISOString?.() ?? null
    });
  }
}

async function syncDerivedEvents(
  match: {
    id: string;
    status: MatchStatus;
    kickoff: Date;
    homeTeam: { name: string };
    awayTeam: { name: string };
    homeScore: number | null;
    awayScore: number | null;
    updatedAt: Date;
  },
  previous: {
    status: MatchStatus;
    homeScore: number | null;
    awayScore: number | null;
  } | null,
  options?: { includeScoreEvents?: boolean }
) {
  await persistEvent(match.id, {
    source: "system",
    type: "fixture_synced",
    detail: `${match.homeTeam.name} vs ${match.awayTeam.name} synced.`,
    happenedAt: match.updatedAt
  }, { broadcast: false });

  const minute = Math.max(1, Math.round((match.updatedAt.getTime() - match.kickoff.getTime()) / 60000));

  if (previous?.status !== "LIVE" && match.status === "LIVE") {
    await persistEvent(match.id, {
      source: "system",
      type: "kickoff",
      detail: "Kickoff",
      minute: 0,
      happenedAt: match.kickoff
    });
  }

  if (options?.includeScoreEvents !== false) {
    const previousHome = previous?.homeScore ?? 0;
    const previousAway = previous?.awayScore ?? 0;
    const currentHome = match.homeScore ?? previousHome;
    const currentAway = match.awayScore ?? previousAway;

    if (currentHome > previousHome) {
      for (let index = previousHome; index < currentHome; index += 1) {
        await persistEvent(match.id, {
          source: "system",
          type: "goal",
          detail: `${match.homeTeam.name} scored.`,
          minute,
          teamName: match.homeTeam.name,
          happenedAt: match.updatedAt
        });
      }
    }

    if (currentAway > previousAway) {
      for (let index = previousAway; index < currentAway; index += 1) {
        await persistEvent(match.id, {
          source: "system",
          type: "goal",
          detail: `${match.awayTeam.name} scored.`,
          minute,
          teamName: match.awayTeam.name,
          happenedAt: match.updatedAt
        });
      }
    }
  }

  if (previous?.status !== "FINISHED" && match.status === "FINISHED") {
    await persistEvent(match.id, {
      source: "system",
      type: "full_time",
      detail: `Final score ${match.homeScore ?? "-"}:${match.awayScore ?? "-"}.`,
      minute,
      happenedAt: match.updatedAt
    });
  }
}

async function syncApiFootballEvents(matchId: string, apiFixtureId: number) {
  if (!env.API_FOOTBALL_KEY) return;

  try {
    const events = await apiFootball.events(apiFixtureId);
    for (const event of events as Array<{
      time?: { elapsed?: number | null; extra?: number | null };
      team?: { name?: string };
      player?: { name?: string };
      assist?: { name?: string };
      type?: string;
      detail?: string;
      comments?: string | null;
    }>) {
      const minute = event.time?.elapsed ?? null;
      const detail = event.detail ?? event.comments ?? event.type ?? "Update";
      await persistEvent(matchId, {
        source: "api-football",
        type: event.type ?? "update",
        detail,
        minute,
        teamName: event.team?.name ?? null,
        playerName: event.player?.name ?? null,
        assistName: event.assist?.name ?? null,
        happenedAt: minute ? new Date(Date.now() - (90 - minute) * 60000) : new Date()
      });
    }
  } catch {
    return;
  }
}

async function upsertFixture(fixture: ApiFixture, source: "football-data" | "api-football") {
  const existing = await prisma.match.findUnique({
    where: { apiMatchId: fixture.fixture.id },
    select: { status: true, homeScore: true, awayScore: true }
  });

  const teams = await ensureTeams(fixture);
  if (!teams) return null;

  const { homeTeam, awayTeam } = teams;
  const data: Prisma.MatchUncheckedCreateInput = {
    apiMatchId: fixture.fixture.id,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    stadium: fixture.fixture.venue?.name,
    city: fixture.fixture.venue?.city,
    round: fixture.league.round,
    group: fixture.league.group,
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    status: statusFromApi(fixture.fixture.status.short),
    winner: winnerFromFixture(fixture),
    kickoff: new Date(fixture.fixture.date)
  };

  const match = await prisma.match.upsert({
    where: { apiMatchId: fixture.fixture.id },
    create: data,
    update: data,
    include: { homeTeam: true, awayTeam: true }
  });

  await syncDerivedEvents(match, existing, { includeScoreEvents: source !== "api-football" });
  if (source === "api-football") {
    await syncApiFootballEvents(match.id, fixture.fixture.id);
  }
  await emitSocketEvent("match_updated", match);

  if (match.status === "FINISHED") {
    await awardFinishedMatch(match.id);
  }

  return match;
}

async function upsertFixturesWithConcurrency(fixtures: ApiFixture[], concurrency: number, source: "football-data" | "api-football") {
  let synced = 0;

  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, fixtures.length)) }, async () => {
    while (cursor < fixtures.length) {
      const index = cursor++;
      const match = await upsertFixture(fixtures[index], source);
      if (match) synced += 1;
    }
  });

  await Promise.all(workers);

  return synced;
}

export async function syncTeams(options?: { competition?: string; season?: number }) {
  const teams = await provider().teams(options);
  const validTeams = teams.filter((item) => hasTeamId(item.team));

  await Promise.all(
    validTeams.map((item) => {
      const name = item.team.name ?? "TBD";
      return prisma.team.upsert({
        where: { apiTeamId: item.team.id as number },
        create: {
          apiTeamId: item.team.id as number,
          name,
          code: item.team.code,
          shortName: shortTeamName(name),
          flag: item.team.logo
        },
        update: {
          name,
          code: item.team.code,
          flag: item.team.logo
        }
      });
    })
  );

  return validTeams.length;
}

export async function syncFixtures(options?: { competition?: string; season?: number }) {
  const source = provider() === apiFootball ? "api-football" : "football-data";
  await syncTeams(options);
  const fixtures = await provider().fixtures(options);
  return upsertFixturesWithConcurrency(fixtures, 4, source);
}

export async function syncLiveMatches(options?: { competition?: string; season?: number }) {
  const source = provider() === apiFootball ? "api-football" : "football-data";
  const fixtures = await provider().liveMatches(options);
  return upsertFixturesWithConcurrency(fixtures, 4, source);
}

export async function syncCompletedMatches(options?: { competition?: string; season?: number }) {
  const source = provider() === apiFootball ? "api-football" : "football-data";
  const fixtures = await provider().completedMatches(options);
  return upsertFixturesWithConcurrency(fixtures, 2, source);
}
