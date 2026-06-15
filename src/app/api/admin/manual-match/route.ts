import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, json, requireAdmin } from "@/lib/http";
import { manualMatchSchema } from "@/lib/validation";
import { shortTeamName, stableTeamId } from "@/lib/utils";
import { emitSocketEvent } from "@/lib/socket-events";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = manualMatchSchema.parse(await request.json());

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.upsert({
        where: { apiTeamId: stableTeamId(body.homeTeamName) },
        create: {
          apiTeamId: stableTeamId(body.homeTeamName),
          name: body.homeTeamName,
          shortName: shortTeamName(body.homeTeamName)
        },
        update: {
          name: body.homeTeamName,
          shortName: shortTeamName(body.homeTeamName)
        }
      }),
      prisma.team.upsert({
        where: { apiTeamId: stableTeamId(body.awayTeamName) },
        create: {
          apiTeamId: stableTeamId(body.awayTeamName),
          name: body.awayTeamName,
          shortName: shortTeamName(body.awayTeamName)
        },
        update: {
          name: body.awayTeamName,
          shortName: shortTeamName(body.awayTeamName)
        }
      })
    ]);

    const match = await prisma.match.create({
      data: {
        apiMatchId: Number(`9${Date.now().toString().slice(-8)}`),
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        stadium: body.stadium || null,
        city: body.city || null,
        round: body.round || null,
        group: body.group || null,
        homeScore: body.status === "FINISHED" ? body.homeScore ?? null : null,
        awayScore: body.status === "FINISHED" ? body.awayScore ?? null : null,
        status: body.status as MatchStatus,
        winner:
          body.status === "FINISHED" && body.homeScore !== undefined && body.awayScore !== undefined
            ? body.homeScore > body.awayScore
              ? "HOME"
              : body.awayScore > body.homeScore
                ? "AWAY"
                : "DRAW"
            : null,
        kickoff: new Date(body.kickoff)
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    await emitSocketEvent("match_updated", match);

    return json({ match }, 201);
  } catch (error) {
    return apiError(error);
  }
}
