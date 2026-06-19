import Image from "next/image";
import { notFound } from "next/navigation";
import { PredictionForm } from "@/components/prediction-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/prisma";
import { buildMatchTimeline } from "@/lib/match-timeline";
import { getMatchInsights } from "@/lib/match-insights";
import { formatKickoff, formatPredictionLabel, matchStatusLabel } from "@/lib/utils";

export default async function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 12
      }
    }
  });

  if (!match) notFound();

  const insights = await getMatchInsights(match.id, match.homeTeam.name, match.awayTeam.name);
  const timeline = buildMatchTimeline(match, insights.total);
  const locked = match.kickoff <= new Date() || match.status !== "SCHEDULED";

  return (
    <PageShell title={`${match.homeTeam.name} vs ${match.awayTeam.name}`} description={formatKickoff(match.kickoff)}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className={locked ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}>
                {locked ? "Locked" : "Open"}
              </Badge>
              <Badge>{matchStatusLabel(match.status)}</Badge>
            </div>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <TeamBlock name={match.homeTeam.name} flag={match.homeTeam.flag} />
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.05] px-6 py-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Score</div>
                <div className="mt-1 text-4xl font-semibold">
                  {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                </div>
              </div>
              <TeamBlock name={match.awayTeam.name} flag={match.awayTeam.flag} />
            </div>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <p>Round: {match.round ?? "TBC"}</p>
              <p>Group: {match.group ?? "TBC"}</p>
              <p>Stadium: {match.stadium ?? "TBC"}</p>
              <p>City: {match.city ?? "TBC"}</p>
              <p>Status: {match.status}</p>
              <p>Winner: {match.winner ?? "TBC"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prediction</CardTitle>
              <Badge>{locked ? "Locked" : "Open"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <PredictionForm
              matchId={match.id}
              locked={locked}
              homeTeamName={match.homeTeam.name}
              awayTeamName={match.awayTeam.name}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Match Prediction Insights</CardTitle>
            <Badge>{insights.total} public picks</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {insights.rows.map((row) => (
            <div key={row.prediction} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{row.label}</p>
                <p className="text-2xl font-semibold">{row.percentage}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-amber-300" style={{ width: `${row.percentage}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{row.count} predictions</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Live Match Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {timeline.map((item) => (
            <div key={`${item.title}-${item.timestamp.toISOString()}`} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div
                className={`mt-1 h-3 w-3 rounded-full ${
                  item.tone === "emerald"
                    ? "bg-emerald-400"
                    : item.tone === "amber"
                      ? "bg-amber-300"
                      : item.tone === "violet"
                        ? "bg-violet-400"
                        : "bg-slate-400"
                }`}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge className="border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.3em]">
                    {item.timestamp.toLocaleString()}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {match.predictions.map((prediction) => (
            <div key={prediction.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">{prediction.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatPredictionLabel(prediction.prediction, match.homeTeam.name, match.awayTeam.name)}{" "}
                {prediction.predictedHomeScore}-{prediction.predictedAwayScore}
              </p>
              <p className="text-sm text-accent">{prediction.points} points</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function TeamBlock({ name, flag }: { name: string; flag: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {flag ? <Image src={flag} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" /> : null}
      <h2 className="text-xl font-semibold">{name}</h2>
    </div>
  );
}
