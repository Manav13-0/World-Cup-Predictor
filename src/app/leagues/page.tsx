import Link from "next/link";
import { LeagueForms } from "@/components/league-form";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function LeaguesPage() {
  const leagues = await prisma.league.findMany({
    include: {
      owner: { select: { name: true } },
      members: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageShell title="Leagues" description="Create private leagues or join friends with an invite code.">
      <Card className="mb-6">
        <CardContent className="p-5">
          <LeagueForms />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {leagues.map((league) => (
          <Card key={league.id}>
            <CardHeader>
              <CardTitle>{league.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Owner: {league.owner.name}</p>
              <p className="text-sm text-muted-foreground">Members: {league.members.length}</p>
              <Badge className="w-fit border-violet-400/20 bg-violet-400/10 text-violet-100">{league.code}</Badge>
              <Button asChild className="w-full">
                <Link href={`/leagues/${league.id}`}>Open League</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
