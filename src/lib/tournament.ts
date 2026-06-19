import { Match, Team } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MatchWithTeams = Match & {
  homeTeam: Team;
  awayTeam: Team;
};

export type QualificationState = "qualified" | "third-place" | "outside";

export type TeamStanding = {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
  qualification: QualificationState;
};

export type StandingGroup = {
  key: string;
  label: string;
  rows: TeamStanding[];
  matches: MatchWithTeams[];
};

export type BracketStage = {
  key: string;
  label: string;
  matches: MatchWithTeams[];
};

export type BracketQualifier = TeamStanding & {
  groupKey: string;
  groupLabel: string;
};

export type BracketAutomation = {
  totalQualified: number;
  groupsReady: number;
  totalGroups: number;
  qualifiers: BracketQualifier[];
  thirdPlaceTeams: BracketQualifier[];
  projectedRoundOf16: Array<{
    home: BracketQualifier;
    away: BracketQualifier;
  }>;
};

const BRACKET_STAGE_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"] as const;

const BRACKET_STAGE_LABELS: Record<(typeof BRACKET_STAGE_ORDER)[number], string> = {
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter Finals",
  SEMI_FINALS: "Semi Finals",
  THIRD_PLACE: "Third Place",
  FINAL: "Final"
};

function normalizeToken(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function formatGroupLabel(value: string | null | undefined) {
  const token = normalizeToken(value);
  if (!token) return "Group Stage";
  const groupMatch = token.match(/^GROUP_?([A-Z0-9]+)$/);
  if (groupMatch) return `Group ${groupMatch[1]}`;

  return token
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function stageKey(value: string | null | undefined) {
  const token = normalizeToken(value);

  if (!token) return "";
  if (token.includes("THIRD_PLACE")) return "THIRD_PLACE";
  if (token === "FINAL") return "FINAL";
  if (token.includes("SEMI")) return "SEMI_FINALS";
  if (token.includes("QUARTER")) return "QUARTER_FINALS";
  if (token.includes("LAST_16") || token.includes("ROUND_OF_16") || token.includes("ROUND_16")) return "LAST_16";
  if (token.includes("LAST_32") || token.includes("ROUND_OF_32") || token.includes("ROUND_32")) return "LAST_32";
  if (token.includes("GROUP")) return "GROUP_STAGE";

  return token;
}

export function stageLabel(value: string | null | undefined) {
  const key = stageKey(value);
  if (key in BRACKET_STAGE_LABELS) return BRACKET_STAGE_LABELS[key as keyof typeof BRACKET_STAGE_LABELS];
  if (key === "GROUP_STAGE") return "Group Stage";
  return formatGroupLabel(key);
}

function emptyStanding(team: Team): Omit<TeamStanding, "rank" | "qualification"> {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  };
}

function addTeam(group: Map<string, Omit<TeamStanding, "rank" | "qualification">>, team: Team) {
  if (!group.has(team.id)) {
    group.set(team.id, emptyStanding(team));
  }
}

function applyResult(
  group: Map<string, Omit<TeamStanding, "rank" | "qualification">>,
  homeTeam: Team,
  awayTeam: Team,
  homeScore: number,
  awayScore: number
) {
  const home = group.get(homeTeam.id);
  const away = group.get(awayTeam.id);
  if (!home || !away) return;

  home.played += 1;
  away.played += 1;
  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;
  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  if (homeScore > awayScore) {
    home.wins += 1;
    home.points += 3;
    away.losses += 1;
  } else if (awayScore > homeScore) {
    away.wins += 1;
    away.points += 3;
    home.losses += 1;
  } else {
    home.draws += 1;
    away.draws += 1;
    home.points += 1;
    away.points += 1;
  }
}

function qualificationForRank(rank: number): QualificationState {
  if (rank <= 2) return "qualified";
  if (rank === 3) return "third-place";
  return "outside";
}

export async function getStandings() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" }
  });

  const groupMatches = matches.filter((match) => stageKey(match.round) === "GROUP_STAGE" || Boolean(match.group));
  const buckets = new Map<
    string,
    {
      label: string;
      rows: Map<string, Omit<TeamStanding, "rank" | "qualification">>;
      matches: MatchWithTeams[];
    }
  >();

  for (const match of groupMatches) {
    const groupKey = normalizeToken(match.group) || "GROUP_STAGE";
    const bucket =
      buckets.get(groupKey) ??
      {
        label: formatGroupLabel(match.group),
        rows: new Map<string, Omit<TeamStanding, "rank" | "qualification">>(),
        matches: []
      };

    addTeam(bucket.rows, match.homeTeam);
    addTeam(bucket.rows, match.awayTeam);
    bucket.matches.push(match);

    if (match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null) {
      applyResult(bucket.rows, match.homeTeam, match.awayTeam, match.homeScore, match.awayScore);
    }

    buckets.set(groupKey, bucket);
  }

  return Array.from(buckets.entries())
    .map(([key, group]) => {
      const rows = Array.from(group.rows.values())
        .sort((left, right) => {
          if (right.points !== left.points) return right.points - left.points;
          if (right.goalDifference !== left.goalDifference) return right.goalDifference - left.goalDifference;
          if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
          return left.team.name.localeCompare(right.team.name);
        })
        .map((row, index) => ({
          ...row,
          rank: index + 1,
          qualification: qualificationForRank(index + 1)
        }));

      return {
        key,
        label: group.label,
        rows,
        matches: group.matches
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function getBracketStages() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" }
  });

  const buckets = new Map<string, MatchWithTeams[]>();

  for (const match of matches) {
    const key = stageKey(match.round);
    if (!BRACKET_STAGE_ORDER.includes(key as (typeof BRACKET_STAGE_ORDER)[number])) continue;

    buckets.set(key, [...(buckets.get(key) ?? []), match]);
  }

  return BRACKET_STAGE_ORDER.map((key) => ({
    key,
    label: BRACKET_STAGE_LABELS[key],
    matches: buckets.get(key) ?? []
  }));
}

export async function getBracketAutomation(): Promise<BracketAutomation> {
  const groups = await getStandings();
  const qualifiers: BracketQualifier[] = [];
  const thirdPlaceTeams: BracketQualifier[] = [];

  for (const group of groups) {
    const topTwo = group.rows.slice(0, 2);
    const thirdPlace = group.rows[2];

    qualifiers.push(
      ...topTwo.map((row) => ({
        ...row,
        groupKey: group.key,
        groupLabel: group.label
      }))
    );

    if (thirdPlace) {
      thirdPlaceTeams.push({
        ...thirdPlace,
        groupKey: group.key,
        groupLabel: group.label
      });
    }
  }

  return {
    totalQualified: qualifiers.length,
    groupsReady: groups.filter((group) => group.rows.length >= 2).length,
    totalGroups: groups.length,
    qualifiers,
    thirdPlaceTeams,
    projectedRoundOf16: qualifiers.reduce<Array<{ home: BracketQualifier; away: BracketQualifier }>>((pairs, current, index, list) => {
      if (index % 2 !== 0) return pairs;
      const next = list[index + 1];
      if (!next) return pairs;
      pairs.push({ home: current, away: next });
      return pairs;
    }, [])
  };
}
