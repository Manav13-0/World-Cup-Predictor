import { Match, PredictionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheDel } from "@/lib/redis";
import { emitSocketEvent } from "@/lib/socket-events";

function matchResult(match: Pick<Match, "homeScore" | "awayScore">): PredictionType | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return "HOME_WIN";
  if (match.awayScore > match.homeScore) return "AWAY_WIN";
  return "DRAW";
}

export function calculatePredictionPoints(
  match: Pick<Match, "homeScore" | "awayScore">,
  prediction: {
    prediction: PredictionType;
    predictedHomeScore: number | null;
    predictedAwayScore: number | null;
  }
) {
  const result = matchResult(match);
  if (!result) return { points: 0, isCorrect: false };

  const winnerCorrect = prediction.prediction === result;
  const exactScore =
    prediction.predictedHomeScore === match.homeScore && prediction.predictedAwayScore === match.awayScore;

  if (exactScore) return { points: 5, isCorrect: true };
  if (winnerCorrect) return { points: 2, isCorrect: true };
  return { points: 0, isCorrect: false };
}

export async function awardFinishedMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true }
  });

  if (!match || match.status !== "FINISHED") return { updated: 0 };

  let updated = 0;

  for (const prediction of match.predictions) {
    const score = calculatePredictionPoints(match, prediction);

    await prisma.$transaction([
      prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          points: score.points,
          isCorrect: score.isCorrect
        }
      }),
      prisma.user.update({
        where: { id: prediction.userId },
        data: {
          totalPoints: { increment: score.points - prediction.points },
          correctPredictions: {
            increment: Number(score.isCorrect) - Number(prediction.isCorrect)
          }
        }
      })
    ]);

    updated += 1;
  }

  await cacheDel("leaderboard:global");
  await emitSocketEvent("points_awarded", { matchId, updated });
  await emitSocketEvent("leaderboard_updated", { matchId });

  return { updated };
}
