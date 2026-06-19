import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile();

async function main() {
  const [{ env }, syncModule, redisModule] = await Promise.all([
    import("@/lib/env"),
    import("@/lib/api-football/sync"),
    import("@/lib/redis")
  ]);

  const { syncCompletedMatches, syncFixtures, syncLiveMatches } = syncModule;
  const { acquireLock, releaseLock } = redisModule;

  const liveIntervalMs = Number(process.env.LIVE_SYNC_INTERVAL_MS ?? 30_000);
  const resultsIntervalMs = Number(process.env.RESULT_SYNC_INTERVAL_MS ?? 5 * 60_000);
  const fixturesIntervalMs = Number(process.env.FIXTURE_SYNC_INTERVAL_MS ?? 6 * 60 * 60_000);

  async function runSyncTask(key: string, ttlSeconds: number, task: () => Promise<number>, label: string) {
    const lock = await acquireLock(key, ttlSeconds);
    if (!lock) {
      console.log(`[live-sync-worker] ${label} skipped; another sync is already running.`);
      return;
    }

    try {
      const synced = await task();
      console.log(`[live-sync-worker] ${label} synced ${synced} records.`);
    } catch (error) {
      console.error(`[live-sync-worker] ${label} failed.`, error);
    } finally {
      await releaseLock(key, lock);
    }
  }

  function scheduleLoop(label: string, intervalMs: number, task: () => Promise<void>, initialDelayMs = 0) {
    let stopped = false;

    const tick = async () => {
      if (stopped) return;

      try {
        await task();
      } finally {
        if (stopped) return;
        setTimeout(tick, intervalMs);
      }
    };

    setTimeout(tick, initialDelayMs);

    return () => {
      stopped = true;
      console.log(`[live-sync-worker] ${label} stopped.`);
    };
  }

  if (!env.FOOTBALL_DATA_API_KEY && !env.API_FOOTBALL_KEY) {
    console.warn("[live-sync-worker] No football API key is configured. Worker will stay idle.");
    return;
  }

  console.log("[live-sync-worker] Starting background sync loops.");
  const stopLive = scheduleLoop("live matches", liveIntervalMs, () =>
    runSyncTask("sync:live", 10 * 60, () => syncLiveMatches(), "live matches")
  );
  const stopResults = scheduleLoop("completed matches", resultsIntervalMs, () =>
    runSyncTask("sync:results", 15 * 60, () => syncCompletedMatches(), "completed matches"),
    15_000
  );
  const stopFixtures = scheduleLoop("fixtures", fixturesIntervalMs, () =>
    runSyncTask("sync:fixtures", 15 * 60, () => syncFixtures(), "fixtures"),
    60_000
  );

  const stopAll = () => {
    stopLive();
    stopResults();
    stopFixtures();
  };

  process.on("SIGINT", stopAll);
  process.on("SIGTERM", stopAll);
}

main().catch((error) => {
  console.error("[live-sync-worker] Fatal error during startup.", error);
  process.exitCode = 1;
});
