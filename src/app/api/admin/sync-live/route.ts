import { syncLiveMatches } from "@/lib/api-football/sync";
import { apiError, json, requireAdmin } from "@/lib/http";
import { env } from "@/lib/env";
import { acquireLock, releaseLock } from "@/lib/redis";

export async function POST(request: Request) {
  const lock = await acquireLock("sync:live", 10 * 60);
  if (!lock) {
    return json({ error: "A live sync is already running." }, 409);
  }

  try {
    await requireAdmin();
    const payload = (await request.json().catch(() => ({}))) as {
      competition?: string;
      season?: string | number;
    };
    const competition = (payload.competition ?? env.FOOTBALL_DATA_COMPETITION_CODE).trim();
    const season = Number(payload.season ?? env.FOOTBALL_DATA_SEASON);
    const synced = await syncLiveMatches({ competition, season });
    const provider = env.FOOTBALL_DATA_API_KEY ? "football-data" : env.API_FOOTBALL_KEY ? "api-football" : "unknown";
    return json({
      synced,
      provider,
      competition,
      season
    });
  } catch (error) {
    return apiError(error);
  } finally {
    await releaseLock("sync:live", lock);
  }
}
