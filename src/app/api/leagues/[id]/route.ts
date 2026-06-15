import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                totalPoints: true,
                correctPredictions: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!league) return json({ error: "League not found" }, 404);

    const rankings = league.members
      .map((member) => member.user)
      .sort((left, right) => {
        if (right.totalPoints !== left.totalPoints) return right.totalPoints - left.totalPoints;
        if (right.correctPredictions !== left.correctPredictions) {
          return right.correctPredictions - left.correctPredictions;
        }
        return left.createdAt.getTime() - right.createdAt.getTime();
      })
      .map((user, index) => ({ ...user, rank: index + 1 }));

    return json({ league, rankings });
  } catch (error) {
    return apiError(error);
  }
}
