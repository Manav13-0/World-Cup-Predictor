import { syncCompletedMatches } from "@/lib/api-football/sync";
import { apiError, json } from "@/lib/http";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const secret = request.headers.get("authorization")?.replace("Bearer ", "");
    if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }

    const synced = await syncCompletedMatches();
    return json({ synced });
  } catch (error) {
    return apiError(error);
  }
}
