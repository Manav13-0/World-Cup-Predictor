import { getLeaderboard } from "@/lib/leaderboard";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard(100);

  return (
    <PageShell title="Leaderboard" description="Rankings update by points, correct predictions, then earliest signup.">
      <Card>
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
              {leaderboard.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.correctPredictions}</TableCell>
                  <TableCell className="text-right font-semibold">{row.totalPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
