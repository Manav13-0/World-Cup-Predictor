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

async function upsertFixture(fixture: ApiFixture) {
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

  await emitSocketEvent("match_updated", match);

  if (match.status === "FINISHED") {
    await awardFinishedMatch(match.id);
  }

  return match;
}

async function upsertFixturesWithConcurrency(fixtures: ApiFixture[], concurrency: number) {
  let synced = 0;

  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, fixtures.length)) }, async () => {
    while (cursor < fixtures.length) {
      const index = cursor++;
      const match = await upsertFixture(fixtures[index]);
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
  await syncTeams(options);
  const fixtures = await provider().fixtures(options);
  return upsertFixturesWithConcurrency(fixtures, 4);
}

export async function syncLiveMatches(options?: { competition?: string; season?: number }) {
  const fixtures = await provider().liveMatches(options);
  return upsertFixturesWithConcurrency(fixtures, 4);
}

export async function syncCompletedMatches(options?: { competition?: string; season?: number }) {
  const fixtures = await provider().completedMatches(options);
  return upsertFixturesWithConcurrency(fixtures, 2);
}
