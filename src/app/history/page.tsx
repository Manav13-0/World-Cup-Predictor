import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPredictionLabel } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const session = await auth();
  let userId = session?.user.id ?? "";

  if (!userId && session?.user.email) {
    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = dbUser?.id ?? "";
  }

  if (!userId) {
    redirect("/login");
  }

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageShell title="Prediction History" description="Every pick, match result, and awarded point total.">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Prediction</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((prediction) => (
                <TableRow key={prediction.id}>
                  <TableCell>
                    {prediction.match.homeTeam.name} vs {prediction.match.awayTeam.name}
                  </TableCell>
                  <TableCell>
                    {formatPredictionLabel(
                      prediction.prediction,
                      prediction.match.homeTeam.name,
                      prediction.match.awayTeam.name
                    )}{" "}
                    {prediction.predictedHomeScore}-{prediction.predictedAwayScore}
                  </TableCell>
                  <TableCell>
                    {prediction.match.homeScore ?? "-"}-{prediction.match.awayScore ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-100">{prediction.points} pts</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
