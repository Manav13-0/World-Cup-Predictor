import { apiError, json, requireUser } from "@/lib/http";
import { getUserRank } from "@/lib/leaderboard";
import { loadUserPredictionsWithMatches } from "@/lib/prediction-loaders";

export async function GET() {
  try {
    const user = await requireUser();
    const [predictions, rank] = await Promise.all([
      loadUserPredictionsWithMatches(user.id),
      getUserRank(user.id)
    ]);

    const correct = predictions.filter((prediction) => prediction.isCorrect).length;
    const finished = predictions.filter((prediction) => prediction.match.status === "FINISHED").length;
    const points = predictions.reduce((sum, prediction) => sum + prediction.points, 0);

    return json({
      totalPredictions: predictions.length,
      correctPredictions: correct,
      wrongPredictions: finished - correct,
      points,
      rank
    });
  } catch (error) {
    return apiError(error);
  }
}
