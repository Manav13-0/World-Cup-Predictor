import { MatchStatus, Team, User } from "@prisma/client";
import { getUserRank } from "@/lib/leaderboard";
import { loadUserPredictionsWithMatches } from "@/lib/prediction-loaders";
import { prisma } from "@/lib/prisma";
import { stageKey } from "@/lib/tournament";

export type ProfileBadge = {
  key: string;
  name: string;
  description: string;
  active: boolean;
};

export type TeamFixture = {
  id: string;
  kickoff: Date;
  round: string | null;
  group: string | null;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
};

export type TeamProfile = {
  team: Team;
  stats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
  upcoming: TeamFixture[];
  recent: TeamFixture[];
};

export type ProfileData = {
  user: User & {
    favoriteTeamId: string | null;
  };
  rank: number | null;
  predictions: Awaited<ReturnType<typeof loadUserPredictionsWithMatches>>;
  badges: ProfileBadge[];
  accuracy: number;
  streak: number;
  favoriteTeamProfile: TeamProfile | null;
  teams: Team[];
};

function buildTeamStats(matches: TeamFixture[], teamId: string) {
  const stats = {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  };

  for (const match of matches) {
    const home = match.homeTeam.id === teamId;
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    const teamScore = home ? homeScore : awayScore;
    const opponentScore = home ? awayScore : homeScore;

    if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) continue;

    stats.played += 1;
    stats.goalsFor += teamScore;
    stats.goalsAgainst += opponentScore;

    if (teamScore > opponentScore) {
      stats.wins += 1;
      stats.points += 3;
    } else if (teamScore < opponentScore) {
      stats.losses += 1;
    } else {
      stats.draws += 1;
      stats.points += 1;
    }
  }

  stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
  return stats;
}

function computeStreak(predictions: Awaited<ReturnType<typeof loadUserPredictionsWithMatches>>) {
  let streak = 0;

  for (const prediction of predictions) {
    if (prediction.match.status !== "FINISHED") continue;
    if (!prediction.isCorrect) break;
    streak += 1;
  }

  return streak;
}

function buildBadges(
  rank: number | null,
  predictions: Awaited<ReturnType<typeof loadUserPredictionsWithMatches>>,
  streak: number
): ProfileBadge[] {
  const totalPredictions = predictions.length;
  const perfectScore = predictions.some((prediction) => prediction.points === 5);
  const knockoutMaster = predictions.some(
    (prediction) => prediction.isCorrect && stageKey(prediction.match.round) !== "GROUP_STAGE" && prediction.match.status === "FINISHED"
  );
  const finalPredictor = predictions.some((prediction) => stageKey(prediction.match.round) === "FINAL");
  const top10 = typeof rank === "number" && rank <= 10;

  return [
    {
      key: "first-prediction",
      name: "First Prediction",
      description: "Made at least one prediction.",
      active: totalPredictions > 0
    },
    {
      key: "perfect-score",
      name: "Perfect Score",
      description: "Scored a 5-point exact result.",
      active: perfectScore
    },
    {
      key: "hot-streak",
      name: "Hot Streak",
      description: "Won three finished predictions in a row.",
      active: streak >= 3
    },
    {
      key: "knockout-master",
      name: "Knockout Master",
      description: "Scored in a knockout round.",
      active: knockoutMaster
    },
    {
      key: "top-10",
      name: "Top 10",
      description: "Reached the global top 10.",
      active: top10
    },
    {
      key: "final-predictor",
      name: "Final Predictor",
      description: "Predicted the World Cup final.",
      active: finalPredictor
    }
  ];
}

export async function getProfileData(userId: string): Promise<ProfileData> {
  const [user, rank, predictions, teams] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId }
    }) as Promise<(User & { favoriteTeamId: string | null }) | null>,
    getUserRank(userId),
    loadUserPredictionsWithMatches(userId, "desc"),
    prisma.team.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  const finished = predictions.filter((prediction) => prediction.match.status === "FINISHED");
  const correct = finished.filter((prediction) => prediction.isCorrect).length;
  const accuracy = finished.length ? Math.round((correct / finished.length) * 100) : 0;
  const streak = computeStreak(predictions);
  const badges = buildBadges(rank, predictions, streak);

  let favoriteTeamProfile: TeamProfile | null = null;

  if (user.favoriteTeamId) {
    const favoriteTeam = await prisma.team.findUnique({
      where: { id: user.favoriteTeamId }
    });

    if (favoriteTeam) {
      const fixtures = await prisma.match.findMany({
        where: {
          OR: [{ homeTeamId: favoriteTeam.id }, { awayTeamId: favoriteTeam.id }]
        },
        include: { homeTeam: true, awayTeam: true },
        orderBy: { kickoff: "asc" }
      });

      const mappedFixtures: TeamFixture[] = fixtures.map((match) => ({
        id: match.id,
        kickoff: match.kickoff,
        round: match.round,
        group: match.group,
        status: match.status,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore
      }));

      const stats = buildTeamStats(mappedFixtures, favoriteTeam.id);

      favoriteTeamProfile = {
        team: favoriteTeam,
        stats,
        upcoming: mappedFixtures.filter((match) => match.status === "SCHEDULED").slice(0, 4),
        recent: mappedFixtures.filter((match) => match.status === "FINISHED").slice(-4).reverse()
      };
    }
  }

  return {
    user,
    rank,
    predictions,
    badges,
    accuracy,
    streak,
    favoriteTeamProfile,
    teams
  };
}
