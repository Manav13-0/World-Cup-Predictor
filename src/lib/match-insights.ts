import { PredictionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MatchInsight = {
  prediction: PredictionType;
  label: string;
  count: number;
  percentage: number;
};

export async function getMatchInsights(matchId: string, homeTeamName: string, awayTeamName: string) {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    select: { prediction: true }
  });

  const counts: Record<PredictionType, number> = {
    HOME_WIN: 0,
    AWAY_WIN: 0,
    DRAW: 0
  };

  for (const prediction of predictions) {
    counts[prediction.prediction] += 1;
  }

  const total = predictions.length;
  const rows: MatchInsight[] = [
    { prediction: "HOME_WIN", label: `${homeTeamName} win`, count: counts.HOME_WIN, percentage: total ? Math.round((counts.HOME_WIN / total) * 100) : 0 },
    { prediction: "DRAW", label: "Draw", count: counts.DRAW, percentage: total ? Math.round((counts.DRAW / total) * 100) : 0 },
    { prediction: "AWAY_WIN", label: `${awayTeamName} win`, count: counts.AWAY_WIN, percentage: total ? Math.round((counts.AWAY_WIN / total) * 100) : 0 }
  ];

  return {
    total,
    rows
  };
}
