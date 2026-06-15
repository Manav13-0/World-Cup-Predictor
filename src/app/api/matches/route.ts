import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, json } from "@/lib/http";
import { matchQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = matchQuerySchema.parse(Object.fromEntries(searchParams));
    const where: Prisma.MatchWhereInput = {
      status: query.status,
      ...(query.q
        ? {
            OR: [
              { homeTeam: { name: { contains: query.q, mode: "insensitive" } } },
              { awayTeam: { name: { contains: query.q, mode: "insensitive" } } },
              { stadium: { contains: query.q, mode: "insensitive" } },
              { city: { contains: query.q, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: { homeTeam: true, awayTeam: true },
        orderBy: { kickoff: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.match.count({ where })
    ]);

    return json({
      matches,
      total,
      page: query.page,
      pageSize: query.pageSize
    });
  } catch (error) {
    return apiError(error);
  }
}
