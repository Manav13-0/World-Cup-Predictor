import { Match, Prediction, Team, User } from "@prisma/client";

export type MatchTimelinePrediction = Prediction & {
  user: User;
};

export type MatchTimelineMatch = Match & {
  homeTeam: Team;
  awayTeam: Team;
  predictions: MatchTimelinePrediction[];
};

export type TimelineTone = "violet" | "emerald" | "amber" | "slate";

export type TimelineItem = {
  title: string;
  detail: string;
  timestamp: Date;
  tone: TimelineTone;
};

export function buildMatchTimeline(match: MatchTimelineMatch, publicPicks: number) {
  const items: TimelineItem[] = [
    {
      title: "Fixture synced",
      detail: `${match.homeTeam.name} vs ${match.awayTeam.name} is in the database.`,
      timestamp: match.updatedAt,
      tone: "slate"
    },
    {
      title: "Prediction window",
      detail: "Users can submit picks until kickoff.",
      timestamp: match.kickoff,
      tone: "amber"
    }
  ];

  if (match.status === "LIVE") {
    items.push({
      title: "Live now",
      detail: `Current score ${match.homeScore ?? "-"}:${match.awayScore ?? "-"}.`,
      timestamp: match.updatedAt,
      tone: "emerald"
    });
  }

  if (match.status === "FINISHED") {
    items.push({
      title: "Final whistle",
      detail: `Result ${match.homeScore ?? "-"}:${match.awayScore ?? "-"}. Points have been calculated.`,
      timestamp: match.updatedAt,
      tone: "violet"
    });
  }

  items.push({
    title: "Public picks",
    detail: `${publicPicks} community predictions recorded.`,
    timestamp: match.updatedAt,
    tone: "slate"
  });

  const recentPrediction = match.predictions[0];
  if (recentPrediction) {
    items.push({
      title: "Latest prediction",
      detail: `${recentPrediction.user.name} picked at ${recentPrediction.createdAt.toLocaleString()}.`,
      timestamp: recentPrediction.createdAt,
      tone: "amber"
    });
  }

  return items.sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime());
}
