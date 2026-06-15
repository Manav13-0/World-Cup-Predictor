import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function LeagueDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      owner: true,
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (!league) notFound();

  const rankings = league.members
    .map((member) => member.user)
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) return right.totalPoints - left.totalPoints;
      if (right.correctPredictions !== left.correctPredictions) return right.correctPredictions - left.correctPredictions;
      return left.createdAt.getTime() - right.createdAt.getTime();
    });

  return (
    <PageShell title={league.name} description={`Invite code: ${league.code}`}>
      <Card>
        <CardHeader>
          <CardTitle>League Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Correct</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.correctPredictions}</TableCell>
                  <TableCell className="text-right">{user.totalPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
