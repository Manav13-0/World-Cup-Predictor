import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const predictions = await prisma.prediction.findMany({
      where: { userId: user.id },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return json({ predictions });
  } catch (error) {
    return apiError(error);
  }
}
