import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/http";
import { leagueCreateSchema, leagueJoinSchema } from "@/lib/validation";
import { makeLeagueCode } from "@/lib/utils";

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({
      include: {
        owner: { select: { name: true } },
        members: true
      },
      orderBy: { createdAt: "desc" }
    });

    return json({ leagues });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const action = typeof body.code === "string" ? "join" : "create";

    if (action === "join") {
      const parsed = leagueJoinSchema.parse(body);
      const league = await prisma.league.findUnique({ where: { code: parsed.code.toUpperCase() } });
      if (!league) return json({ error: "League not found" }, 404);

      await prisma.leagueMember.upsert({
        where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
        create: { leagueId: league.id, userId: user.id },
        update: {}
      });

      return json({ league });
    }

    const parsed = leagueCreateSchema.parse(body);
    const code = makeLeagueCode();
    const league = await prisma.league.create({
      data: {
        name: parsed.name,
        code,
        ownerId: user.id,
        members: {
          create: { userId: user.id }
        }
      }
    });

    return json({ league }, 201);
  } catch (error) {
    return apiError(error);
  }
}
