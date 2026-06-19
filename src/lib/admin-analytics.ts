import { prisma } from "@/lib/prisma";

export type MostPredictedTeam = {
  name: string;
  code: string | null;
  count: number;
};

export type AdminTopUser = {
  id: string;
  name: string;
  totalPoints: number;
  correctPredictions: number;
  predictions: number;
};

export type AdminRecentMatch = {
  id: string;
  homeTeam: { name: string; code: string | null };
  awayTeam: { name: string; code: string | null };
  status: string;
  kickoff: Date;
  updatedAt: Date;
  homeScore: number | null;
  awayScore: number | null;
};

export type AdminAnalytics = {
  counts: {
    users: number;
    matches: number;
    leagues: number;
    predictions: number;
    activeLeagues: number;
  };
  syncHealth: {
    liveMatches: number;
    finishedMatches: number;
    scheduledMatches: number;
    latestMatchUpdate: { updatedAt: Date } | null;
  };
  predictionsPerMatch: number;
  mostPredictedTeams: MostPredictedTeam[];
  predictionBreakdown: {
    homeWins: number;
    draws: number;
    awayWins: number;
  };
  topUsers: AdminTopUser[];
  recentMatches: AdminRecentMatch[];
};

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [users, matches, leagues, predictionCount, leagueRows, predictionRows, topUsers, recentMatches] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.league.count(),
    prisma.prediction.count(),
    prisma.league.findMany({
      include: { members: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.prediction.findMany({
      select: {
        prediction: true,
        matchId: true
      }
    }),
    prisma.user.findMany({
      orderBy: [{ totalPoints: "desc" }, { correctPredictions: "desc" }, { createdAt: "asc" }],
      take: 5,
      select: {
        id: true,
        name: true,
        totalPoints: true,
        correctPredictions: true,
        _count: {
          select: {
            predictions: true
          }
        }
      }
    }),
    prisma.match.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        kickoff: true,
        updatedAt: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { name: true, code: true } },
        awayTeam: { select: { name: true, code: true } }
      }
    })
  ]);

  const matchIds = Array.from(new Set(predictionRows.map((prediction) => prediction.matchId)));
  const matchRows = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    select: {
      id: true,
      homeTeam: { select: { name: true, code: true } },
      awayTeam: { select: { name: true, code: true } }
    }
  });
  const matchById = new Map(matchRows.map((match) => [match.id, match]));

  const liveMatches = await prisma.match.count({ where: { status: "LIVE" } });
  const finishedMatches = await prisma.match.count({ where: { status: "FINISHED" } });
  const scheduledMatches = await prisma.match.count({ where: { status: "SCHEDULED" } });
  const latestMatchUpdate = await prisma.match.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true }
  });

  const teamCounts = new Map<string, MostPredictedTeam>();

  for (const prediction of predictionRows) {
    const match = matchById.get(prediction.matchId);
    if (!match) continue;
    if (prediction.prediction === "DRAW") continue;

    const team = prediction.prediction === "HOME_WIN" ? match.homeTeam : match.awayTeam;
    const current = teamCounts.get(team.name) ?? { name: team.name, code: team.code ?? null, count: 0 };
    current.count += 1;
    teamCounts.set(team.name, current);
  }

  const mostPredictedTeams = Array.from(teamCounts.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const predictionBreakdown = {
    homeWins: predictionRows.filter((prediction) => prediction.prediction === "HOME_WIN").length,
    draws: predictionRows.filter((prediction) => prediction.prediction === "DRAW").length,
    awayWins: predictionRows.filter((prediction) => prediction.prediction === "AWAY_WIN").length
  };

  const activeLeagues = leagueRows.filter((league) => league.members.length > 0).length;

  return {
    counts: {
      users,
      matches,
      leagues,
      predictions: predictionCount,
      activeLeagues
    },
    syncHealth: {
      liveMatches,
      finishedMatches,
      scheduledMatches,
      latestMatchUpdate
    },
    predictionsPerMatch: matches ? Math.round((predictionCount / matches) * 10) / 10 : 0,
    mostPredictedTeams,
    predictionBreakdown,
    topUsers: topUsers.map((user) => ({
      id: user.id,
      name: user.name,
      totalPoints: user.totalPoints,
      correctPredictions: user.correctPredictions,
      predictions: user._count.predictions
    })),
    recentMatches
  };
}
