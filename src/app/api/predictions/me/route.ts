import { apiError, json, requireUser } from "@/lib/http";
import { loadUserPredictionsWithMatches } from "@/lib/prediction-loaders";

export async function GET() {
  try {
    const user = await requireUser();
    const predictions = await loadUserPredictionsWithMatches(user.id, "desc");

    return json({ predictions });
  } catch (error) {
    return apiError(error);
  }
}
