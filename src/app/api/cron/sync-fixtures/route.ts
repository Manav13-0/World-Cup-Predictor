import { syncFixtures } from "@/lib/api-football/sync";
import { apiError, json } from "@/lib/http";
import { env } from "@/lib/env";
import { acquireLock, releaseLock } from "@/lib/redis";

export async function GET(request: Request) {
  const lock = await acquireLock("sync:fixtures", 15 * 60);
  if (!lock) {
    return json({ error: "A fixture sync is already running." }, 409);
  }

  try {
    const secret = request.headers.get("authorization")?.replace("Bearer ", "");
    if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }

    const synced = await syncFixtures();
    return json({ synced });
  } catch (error) {
    return apiError(error);
  } finally {
    await releaseLock("sync:fixtures", lock);
  }
}
