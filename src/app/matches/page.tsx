import { MatchStatus } from "@prisma/client";
import { MatchCard } from "@/components/match-card";
import { PageShell } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { prisma } from "@/lib/prisma";

export default async function MatchesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: MatchStatus }>;
}) {
  const params = await searchParams;
  const matches = await prisma.match.findMany({
    where: {
      status: params.status || undefined,
      ...(params.q
        ? {
            OR: [
              { homeTeam: { name: { contains: params.q, mode: "insensitive" } } },
              { awayTeam: { name: { contains: params.q, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
    take: 48
  });

  return (
    <PageShell title="Matches" description="Search fixtures, filter by status, and submit predictions before kickoff.">
      <form className="mb-6 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input name="q" defaultValue={params.q} placeholder="Search teams" />
        <Select name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="FINISHED">Finished</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </PageShell>
  );
}
