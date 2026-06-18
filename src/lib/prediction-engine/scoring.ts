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
    include: {
      predictions: {
        select: {
          id: true,
          userId: true,
          points: true,
          isCorrect: true,
          predictedHomeScore: true,
          predictedAwayScore: true,
          prediction: true
        }
      }
    }
  });

  if (!match || match.status !== "FINISHED") return { updated: 0 };

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: match.predictions.map((prediction) => prediction.userId) } },
    select: { id: true }
  });
  const existingUserIds = new Set(existingUsers.map((user) => user.id));

  const result = await retryWriteConflict(async () =>
    prisma.$transaction(async (tx) => {
      let updated = 0;
      const awards = new Map<string, number>();

      for (const prediction of match.predictions) {
        if (!existingUserIds.has(prediction.userId)) {
          await tx.prediction.deleteMany({
            where: { id: prediction.id }
          });
          continue;
        }

        const score = calculatePredictionPoints(match, prediction);
        const pointDelta = score.points - prediction.points;
        const correctDelta = Number(score.isCorrect) - Number(prediction.isCorrect);

        if (pointDelta !== 0 || correctDelta !== 0) {
          await tx.prediction.update({
            where: { id: prediction.id },
            data: {
              points: score.points,
              isCorrect: score.isCorrect
            }
          });

          await tx.user.update({
            where: { id: prediction.userId },
            data: {
              totalPoints: { increment: pointDelta },
              correctPredictions: { increment: correctDelta }
            }
          });
        }

        updated += 1;

        if (pointDelta > 0) {
          awards.set(prediction.userId, (awards.get(prediction.userId) ?? 0) + pointDelta);
        }
      }

      return {
        updated,
        awards: Array.from(awards.entries()).map(([userId, points]) => ({ userId, points }))
      };
    })
  );

  await cacheDel("leaderboard:global");
  await emitSocketEvent("points_awarded", {
    matchId,
    updated: result.updated,
    awards: result.awards
  });
  await emitSocketEvent("leaderboard_updated", { matchId });

  return { updated: result.updated };
}
