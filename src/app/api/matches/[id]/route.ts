import { prisma } from "@/lib/prisma";
import { apiError, json } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          select: {
            prediction: true,
            predictedHomeScore: true,
            predictedAwayScore: true,
            points: true,
            user: { select: { name: true, image: true } }
          },
          take: 20,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!match) return json({ error: "Match not found" }, 404);
    return json({ match });
  } catch (error) {
    return apiError(error);
  }
}
