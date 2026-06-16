import { syncCompletedMatches } from "@/lib/api-football/sync";
import { apiError, json, requireAdmin } from "@/lib/http";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = (await request.json().catch(() => ({}))) as {
      competition?: string;
      season?: string | number;
    };
    const competition = (payload.competition ?? env.FOOTBALL_DATA_COMPETITION_CODE).trim();
    const season = Number(payload.season ?? env.FOOTBALL_DATA_SEASON);
    const synced = await syncCompletedMatches({ competition, season });
    const provider = env.FOOTBALL_DATA_API_KEY ? "football-data" : env.API_FOOTBALL_KEY ? "api-football" : "unknown";
    return json({
      synced,
      provider,
      competition,
      season
    });
  } catch (error) {
    return apiError(error);
  }
}
