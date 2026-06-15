import { syncFixtures } from "@/lib/api-football/sync";
import { apiError, json, requireAdmin } from "@/lib/http";

export async function POST() {
  try {
    await requireAdmin();
    const synced = await syncFixtures();
    return json({ synced });
  } catch (error) {
    return apiError(error);
  }
}
