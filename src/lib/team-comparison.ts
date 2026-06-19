import { Match, Team } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ComparisonMatch = Match & {
  homeTeam: Team;
  awayTeam: Team;
};

export type ComparisonSummary = {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  cleanSheets: number;
  failedToScore: number;
  recentMatches: ComparisonMatch[];
};

export type HeadToHeadSummary = {
  matches: ComparisonMatch[];
  teamAWins: number;
  teamBWins: number;
  draws: number;
  goalsForA: number;
  goalsForB: number;
};

export type TeamComparisonData = {
  teams: Team[];
  teamA: ComparisonSummary;
  teamB: ComparisonSummary;
  headToHead: HeadToHeadSummary;
};

function buildSummary(team: Team, matches: ComparisonMatch[]): ComparisonSummary {
  const summary: Omit<ComparisonSummary, "team" | "recentMatches"> = {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    cleanSheets: 0,
    failedToScore: 0
  };

  const recentMatches = [...matches]
    .filter((match) => match.homeTeam.id === team.id || match.awayTeam.id === team.id)
    .sort((left, right) => right.kickoff.getTime() - left.kickoff.getTime())
    .slice(0, 5);

  for (const match of matches) {
    const isHome = match.homeTeam.id === team.id;
    const isAway = match.awayTeam.id === team.id;
    if (!isHome && !isAway) continue;
    if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) continue;

    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;

    summary.played += 1;
    summary.goalsFor += teamScore;
    summary.goalsAgainst += opponentScore;
    summary.goalDifference = summary.goalsFor - summary.goalsAgainst;

    if (teamScore > opponentScore) {
      summary.wins += 1;
      summary.points += 3;
    } else if (teamScore < opponentScore) {
      summary.losses += 1;
    } else {
      summary.draws += 1;
      summary.points += 1;
    }

    if (opponentScore === 0) summary.cleanSheets += 1;
    if (teamScore === 0) summary.failedToScore += 1;
  }

  return {
    team,
    ...summary,
    recentMatches
  };
}

function buildHeadToHead(matches: ComparisonMatch[], teamAId: string, teamBId: string): HeadToHeadSummary {
  const headToHeadMatches = matches
    .filter(
      (match) =>
        (match.homeTeam.id === teamAId && match.awayTeam.id === teamBId) ||
        (match.homeTeam.id === teamBId && match.awayTeam.id === teamAId)
    )
    .sort((left, right) => right.kickoff.getTime() - left.kickoff.getTime());

  const summary: HeadToHeadSummary = {
    matches: headToHeadMatches,
    teamAWins: 0,
    teamBWins: 0,
    draws: 0,
    goalsForA: 0,
    goalsForB: 0
  };

  for (const match of headToHeadMatches) {
    if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) continue;

    const teamAScore = match.homeTeam.id === teamAId ? match.homeScore : match.awayScore;
    const teamBScore = match.homeTeam.id === teamBId ? match.homeScore : match.awayScore;

    summary.goalsForA += teamAScore;
    summary.goalsForB += teamBScore;

    if (teamAScore > teamBScore) {
      summary.teamAWins += 1;
    } else if (teamBScore > teamAScore) {
      summary.teamBWins += 1;
    } else {
      summary.draws += 1;
    }
  }

  return summary;
}

export async function getComparisonTeams() {
  return prisma.team.findMany({ orderBy: { name: "asc" } });
}

export async function getTeamComparisonData(teamAId: string, teamBId: string): Promise<TeamComparisonData> {
  const [teams, matches] = await Promise.all([
    getComparisonTeams(),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" }
    })
  ]);

  const teamA = teams.find((team) => team.id === teamAId);
  const teamB = teams.find((team) => team.id === teamBId);

  if (!teamA || !teamB) {
    throw new Error("Team not found");
  }

  const teamASummary = buildSummary(teamA, matches);
  const teamBSummary = buildSummary(teamB, matches);
  const headToHead = buildHeadToHead(matches, teamAId, teamBId);

  return {
    teams,
    teamA: teamASummary,
    teamB: teamBSummary,
    headToHead
  };
}
