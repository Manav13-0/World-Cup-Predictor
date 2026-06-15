import { getLeaderboard } from "@/lib/leaderboard";
import { apiError, json } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 100);
    const leaderboard = await getLeaderboard(limit);
    return json({ leaderboard });
  } catch (error) {
    return apiError(error);
  }
}
