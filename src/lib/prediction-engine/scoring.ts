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

function isWriteConflict(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("write conflict") ||
    message.includes("deadlock") ||
    message.includes("Please retry your transaction") ||
    message.includes("Transaction failed")
  );
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWriteConflict<T>(operation: () => Promise<T>, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isWriteConflict(error) || attempt === attempts) {
        throw error;
      }

      await wait(150 * attempt);
    }
  }

  throw new Error("Write conflict retry failed.");
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
    include: { predictions: { select: { id: true } } }
  });

  if (!match || match.status !== "FINISHED") return { updated: 0 };

  let updated = 0;
  const awards = new Map<string, number>();

  for (const prediction of match.predictions) {
    const scored = await retryWriteConflict(async () =>
      prisma.$transaction(async (tx) => {
        const currentPrediction = await tx.prediction.findUnique({
          where: { id: prediction.id }
        });

        if (!currentPrediction) return false;

        const user = await tx.user.findUnique({
          where: { id: currentPrediction.userId },
          select: { id: true }
        });

        if (!user) {
          await tx.prediction.deleteMany({
            where: { id: currentPrediction.id }
          });

          return false;
        }

        const score = calculatePredictionPoints(match, currentPrediction);
        const pointDelta = score.points - currentPrediction.points;
        const correctDelta = Number(score.isCorrect) - Number(currentPrediction.isCorrect);

        await tx.prediction.update({
          where: { id: currentPrediction.id },
          data: {
            points: score.points,
            isCorrect: score.isCorrect
          }
        });

        if (pointDelta !== 0 || correctDelta !== 0) {
          await tx.user.update({
            where: { id: currentPrediction.userId },
            data: {
              totalPoints: { increment: pointDelta },
              correctPredictions: { increment: correctDelta }
            }
          });
        }

        return {
          userId: currentPrediction.userId,
          pointDelta
        };
      })
    );

    if (scored) {
      updated += 1;
      if (scored.pointDelta > 0) {
        awards.set(scored.userId, (awards.get(scored.userId) ?? 0) + scored.pointDelta);
      }
    }
  }

  await cacheDel("leaderboard:global");
  await emitSocketEvent("points_awarded", {
    matchId,
    updated,
    awards: Array.from(awards.entries()).map(([userId, points]) => ({ userId, points }))
  });
  await emitSocketEvent("leaderboard_updated", { matchId });

  return { updated };
}
