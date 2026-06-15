import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/http";
import { predictionSchema } from "@/lib/validation";
import { emitSocketEvent } from "@/lib/socket-events";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = predictionSchema.parse(await request.json());

    const match = await prisma.match.findUnique({
      where: { id: body.matchId }
    });

    if (!match) return json({ error: "Match not found" }, 404);
    if (match.kickoff <= new Date() || match.status !== "SCHEDULED") {
      return json({ error: "Predictions are locked for this match." }, 409);
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId: body.matchId
        }
      },
      create: {
        userId: user.id,
        matchId: body.matchId,
        prediction: body.prediction,
        predictedHomeScore: body.predictedHomeScore ?? null,
        predictedAwayScore: body.predictedAwayScore ?? null
      },
      update: {
        prediction: body.prediction,
        predictedHomeScore: body.predictedHomeScore ?? null,
        predictedAwayScore: body.predictedAwayScore ?? null
      }
    });

    await emitSocketEvent("prediction_created", prediction);
    return json({ prediction }, 201);
  } catch (error) {
    return apiError(error);
  }
}
