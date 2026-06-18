import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/http";
import { favoriteTeamSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = favoriteTeamSchema.parse(await request.json());
    const favoriteTeamId = body.favoriteTeamId?.trim() || null;

    if (favoriteTeamId) {
      const team = await prisma.team.findUnique({ where: { id: favoriteTeamId } });
      if (!team) return json({ error: "Team not found" }, 404);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { ...(favoriteTeamId ? { favoriteTeamId } : { favoriteTeamId: null }) } as any
    });

    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
