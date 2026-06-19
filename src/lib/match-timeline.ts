import { Match, Prediction, Team, User } from "@prisma/client";

export type MatchTimelinePrediction = Prediction & {
  user: User;
};

export type MatchTimelineMatch = Match & {
  homeTeam: Team;
  awayTeam: Team;
  predictions: MatchTimelinePrediction[];
  events?: Array<{
    id: string;
    source: string;
    type: string;
    detail: string;
    teamName: string | null;
    playerName: string | null;
    assistName: string | null;
    minute: number | null;
    period: string | null;
    happenedAt: Date | null;
    createdAt: Date;
  }>;
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

  for (const event of match.events ?? []) {
    const title =
      event.type === "goal"
        ? "Goal"
        : event.type === "yellow_card"
          ? "Yellow card"
          : event.type === "red_card"
            ? "Red card"
            : event.type === "kickoff"
              ? "Kickoff"
              : event.type === "full_time"
                ? "Full time"
                : event.type.replace(/_/g, " ");

    const timestamp = event.happenedAt ?? event.createdAt;
    const minuteLabel = event.minute !== null ? `${event.minute}'` : null;
    items.push({
      title,
      detail: [minuteLabel, event.teamName, event.playerName, event.detail].filter(Boolean).join(" · "),
      timestamp,
      tone: event.type === "goal" ? "emerald" : event.type.includes("card") ? "amber" : "slate"
    });
  }

  return items.sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime());
}
