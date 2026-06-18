import { prisma } from "@/lib/prisma";

export type MostPredictedTeam = {
  name: string;
  code: string | null;
  count: number;
};

export async function getAdminAnalytics() {
  const [users, matches, leagues, predictionCount, leagueRows, predictionRows] = await Promise.all([
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
    mostPredictedTeams
  };
}
