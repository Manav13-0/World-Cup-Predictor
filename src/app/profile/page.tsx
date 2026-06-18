import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AnimatedCounter } from "@/components/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { FavoriteTeamForm } from "@/components/favorite-team-form";
import { getProfileData } from "@/lib/profile";
import { formatKickoff, formatPredictionLabel } from "@/lib/utils";
import { getStandings } from "@/lib/tournament";

function badgeTone(active: boolean) {
  return active
    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
    : "border-white/10 bg-white/5 text-muted-foreground";
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user.id ?? "";

  if (!userId) {
    redirect("/login");
  }

  const profile = await getProfileData(userId);
  const standings = await getStandings();
  const favoriteGroup = profile.favoriteTeamProfile
    ? standings.find((group) => group.rows.some((row) => row.team.id === profile.favoriteTeamProfile?.team.id))
    : null;

  return (
    <PageShell title="Profile" description="Your points, streaks, badges, favorite team, and recent predictions.">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Player card</p>
                <CardTitle className="mt-2 text-2xl">{profile.user.name}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{profile.user.email}</p>
              </div>
              <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-100">Rank #{profile.rank ?? "-"}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Total Points", profile.user.totalPoints],
                  ["Accuracy", `${profile.accuracy}%`],
                  ["Streak", profile.streak],
                  ["Predictions", profile.predictions.length]
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievement Badges</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {profile.badges.map((badge) => (
                <div key={badge.key} className={`rounded-2xl border p-4 ${badgeTone(badge.active)}`}>
                  <p className="text-sm font-semibold">{badge.name}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{badge.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Predictions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {profile.predictions.slice(0, 6).map((prediction) => (
                <div key={prediction.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-medium">
                    {prediction.match.homeTeam.name} vs {prediction.match.awayTeam.name}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatPredictionLabel(
                      prediction.prediction,
                      prediction.match.homeTeam.name,
                      prediction.match.awayTeam.name
                    )}{" "}
                    {prediction.predictedHomeScore}-{prediction.predictedAwayScore}
                  </p>
                  <p className="mt-2 text-sm text-amber-100">{prediction.points} points</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Favorite Team System</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick a team and we will show their fixtures, results, and group context here.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <FavoriteTeamForm
                teams={profile.teams.map((team) => ({ id: team.id, name: team.name, code: team.code }))}
                currentFavoriteTeamId={profile.user.favoriteTeamId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Team</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.favoriteTeamProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {profile.favoriteTeamProfile.team.flag ? (
                      <Image
                        src={profile.favoriteTeamProfile.team.flag}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : null}
                    <div>
                      <p className="text-xl font-semibold">{profile.favoriteTeamProfile.team.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {profile.favoriteTeamProfile.team.code ?? "WC"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["P", profile.favoriteTeamProfile.stats.played],
                      ["W", profile.favoriteTeamProfile.stats.wins],
                      ["D", profile.favoriteTeamProfile.stats.draws],
                      ["Pts", profile.favoriteTeamProfile.stats.points]
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 text-2xl font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                  {favoriteGroup ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Group</p>
                      <p className="mt-2 text-lg font-semibold">{favoriteGroup.label}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Upcoming fixtures</p>
                    <div className="grid gap-3">
                      {profile.favoriteTeamProfile.upcoming.length ? (
                        profile.favoriteTeamProfile.upcoming.map((match) => (
                          <div key={match.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                            <p className="font-medium">
                              {match.homeTeam.name} vs {match.awayTeam.name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatKickoff(match.kickoff)} {match.round ? `- ${match.round}` : ""}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No upcoming fixtures yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Recent fixtures</p>
                    <div className="grid gap-3">
                      {profile.favoriteTeamProfile.recent.length ? (
                        profile.favoriteTeamProfile.recent.map((match) => (
                          <div key={match.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                            <p className="font-medium">
                              {match.homeTeam.name} {match.homeScore ?? "-"}:{match.awayScore ?? "-"} {match.awayTeam.name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{formatKickoff(match.kickoff)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No finished fixtures yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm leading-6 text-muted-foreground">
                  Pick a favorite team on the left and we'll pin their fixtures and stats here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
