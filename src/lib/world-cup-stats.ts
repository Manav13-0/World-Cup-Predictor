import { Team } from "@prisma/client";
import { footballData } from "@/lib/football-data/client";
import { prisma } from "@/lib/prisma";

type TeamStats = {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
  failedToScore: number;
  points: number;
};

type PlayerScorer = {
  id: number;
  name: string;
  nationality?: string | null;
  team: {
    id: number | null;
    name: string;
    code?: string;
    crest?: string;
  };
  goals: number;
  assists: number;
  penalties: number;
};

function emptyTeamStats(team: Team): TeamStats {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    cleanSheets: 0,
    failedToScore: 0,
    points: 0
  };
}

function addTeam(teamStats: Map<string, TeamStats>, team: Team) {
  if (!teamStats.has(team.id)) {
    teamStats.set(team.id, emptyTeamStats(team));
  }
}

async function loadTopScorers(): Promise<PlayerScorer[]> {
  try {
    return await footballData.scorers({ limit: 50 });
  } catch {
    return [];
  }
}

export async function getWorldCupStats() {
  const [matches, topScorers] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" }
    }),
    loadTopScorers()
  ]);

  const finishedMatches = matches.filter(
    (match) => match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null
  );
  const teamStats = new Map<string, TeamStats>();

  for (const match of matches) {
    addTeam(teamStats, match.homeTeam);
    addTeam(teamStats, match.awayTeam);
  }

  for (const match of finishedMatches) {
    const home = teamStats.get(match.homeTeam.id);
    const away = teamStats.get(match.awayTeam.id);
    if (!home || !away || match.homeScore === null || match.awayScore === null) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (match.awayScore === 0) home.cleanSheets += 1;
    if (match.homeScore === 0) away.cleanSheets += 1;
    if (match.homeScore === 0) home.failedToScore += 1;
    if (match.awayScore === 0) away.failedToScore += 1;

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (match.awayScore > match.homeScore) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const teams = Array.from(teamStats.values());
  const totalGoals = finishedMatches.reduce((total, match) => total + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0);
  const highestScoringMatch = [...finishedMatches].sort(
    (left, right) => (right.homeScore ?? 0) + (right.awayScore ?? 0) - ((left.homeScore ?? 0) + (left.awayScore ?? 0))
  )[0];
  const biggestWin = [...finishedMatches].sort(
    (left, right) => Math.abs((right.homeScore ?? 0) - (right.awayScore ?? 0)) - Math.abs((left.homeScore ?? 0) - (left.awayScore ?? 0))
  )[0];

  return {
    summary: {
      totalMatches: matches.length,
      finishedMatches: finishedMatches.length,
      scheduledMatches: matches.filter((match) => match.status === "SCHEDULED").length,
      totalGoals,
      goalsPerMatch: finishedMatches.length ? totalGoals / finishedMatches.length : 0
    },
    records: {
      highestScoringMatch,
      biggestWin,
      bestAttack: [...teams].sort((left, right) => right.goalsFor - left.goalsFor)[0],
      bestDefense: [...teams]
        .filter((team) => team.played > 0)
        .sort((left, right) => left.goalsAgainst - right.goalsAgainst || right.cleanSheets - left.cleanSheets)[0],
      mostCleanSheets: [...teams].sort((left, right) => right.cleanSheets - left.cleanSheets)[0]
    },
    teams: teams.sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      if (right.goalDifference !== left.goalDifference) return right.goalDifference - left.goalDifference;
      if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
      return left.team.name.localeCompare(right.team.name);
    }),
    topScorers: [...topScorers].sort((left, right) => right.goals - left.goals),
    topAssists: [...topScorers].filter((scorer) => scorer.assists > 0).sort((left, right) => right.assists - left.assists)
  };
}

export type { TeamStats, PlayerScorer };
