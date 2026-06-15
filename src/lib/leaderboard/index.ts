import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";

export type LeaderboardRow = {
  rank: number;
  id: string;
  name: string;
  image: string | null;
  totalPoints: number;
  correctPredictions: number;
  createdAt: Date;
};

export async function getLeaderboard(limit = 100): Promise<LeaderboardRow[]> {
  const cacheKey = "leaderboard:global";
  const cached = await cacheGet<LeaderboardRow[]>(cacheKey);
  if (cached) return cached.slice(0, limit);

  const users = await prisma.user.findMany({
    orderBy: [{ totalPoints: "desc" }, { correctPredictions: "desc" }, { createdAt: "asc" }],
    take: Math.max(limit, 100),
    select: {
      id: true,
      name: true,
      image: true,
      totalPoints: true,
      correctPredictions: true,
      createdAt: true
    }
  });

  const rows = users.map((user, index) => ({
    rank: index + 1,
    ...user
  }));

  await cacheSet(cacheKey, rows, 300);
  return rows.slice(0, limit);
}

export async function getUserRank(userId: string) {
  const rows = await getLeaderboard(1000);
  return rows.find((row) => row.id === userId)?.rank ?? null;
}
