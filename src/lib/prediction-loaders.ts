import { Match, Prediction, Team } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PredictionWithMatch = Prediction & {
  match: Match & {
    homeTeam: Team;
    awayTeam: Team;
  };
};

export async function loadUserPredictionsWithMatches(userId: string, orderBy: "asc" | "desc" = "asc") {
  const predictions = await prisma.prediction.findMany({
    where: { userId },
    orderBy: { createdAt: orderBy }
  });

  const matchIds = Array.from(new Set(predictions.map((prediction) => prediction.matchId)));
  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    include: { homeTeam: true, awayTeam: true }
  });

  const matchById = new Map(matches.map((match) => [match.id, match]));

  return predictions.flatMap((prediction) => {
    const match = matchById.get(prediction.matchId);
    if (!match) return [];

    return [
      {
        ...prediction,
        match
      } satisfies PredictionWithMatch
    ];
  });
}
