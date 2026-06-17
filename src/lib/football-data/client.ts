import { cacheGet, cacheSet } from "@/lib/redis";
import { env, resolvedFootballDataEnv } from "@/lib/env";

const BASE_URL = "https://api.football-data.org/v4";

type FootballDataCompetitionResponse = {
  teams: FootballDataTeam[];
  matches: FootballDataMatch[];
};

type FootballDataTeam = {
  id: number | null;
  name: string | null;
  shortName?: string;
  tla?: string;
  crest?: string;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string;
  venue?: string | null;
  area?: { name?: string };
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
  };
};

type FootballDataScorer = {
  player: {
    id: number;
    name: string;
    nationality?: string | null;
  };
  team: FootballDataTeam;
  goals?: number | null;
  assists?: number | null;
  penalties?: number | null;
};

type FootballDataScorersResponse = {
  scorers: FootballDataScorer[];
};

function assertApiKey() {
  if (!env.FOOTBALL_DATA_API_KEY) {
    throw new Error("FOOTBALL_DATA_API_KEY is required for football-data synchronization.");
  }
}

async function request<T>(path: string, ttlSeconds = 60, retries = 2): Promise<T> {
  assertApiKey();

  const cacheKey = `football-data:${path}`;
  const cached = await cacheGet<T>(cacheKey);
  if (cached) return cached;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
          "X-Auth-Token": env.FOOTBALL_DATA_API_KEY ?? ""
        },
        next: { revalidate: ttlSeconds }
      });

      if (!response.ok) {
        throw new Error(`football-data request failed with ${response.status}`);
      }

      const data = (await response.json()) as T;
      await cacheSet(cacheKey, data, ttlSeconds);
      return data;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("football-data request failed.");
}

export const footballData = {
  fixtures: async (options?: { competition?: string; season?: number }) => {
    const { competition, season } = resolvedFootballDataEnv(options);
    const data = await request<FootballDataCompetitionResponse>(
      `/competitions/${competition}/matches?season=${season}`,
      300
    );

    return data.matches.map((match) => ({
      fixture: {
        id: match.id,
        date: match.utcDate,
        status: {
          short: match.status,
          long: match.status
        },
        venue: {
          name: match.venue ?? undefined,
          city: match.area?.name
        }
      },
      league: {
        round: match.stage,
        group: match.group
      },
      teams: {
        home: {
          id: match.homeTeam.id,
          name: match.homeTeam.name ?? "TBD",
          logo: match.homeTeam.crest,
          winner: null
        },
        away: {
          id: match.awayTeam.id,
          name: match.awayTeam.name ?? "TBD",
          logo: match.awayTeam.crest,
          winner: null
        }
      },
      goals: {
        home: match.score?.fullTime?.home ?? null,
        away: match.score?.fullTime?.away ?? null
      }
    }));
  },
  liveMatches: async (options?: { competition?: string; season?: number }) => {
    const { competition, season } = resolvedFootballDataEnv(options);
    const data = await request<FootballDataCompetitionResponse>(
      `/competitions/${competition}/matches?season=${season}&status=IN_PLAY`,
      15
    );

    return data.matches.map((match) => ({
      fixture: {
        id: match.id,
        date: match.utcDate,
        status: {
          short: match.status,
          long: match.status
        },
        venue: {
          name: match.venue ?? undefined,
          city: match.area?.name
        }
      },
      league: {
        round: match.stage,
        group: match.group
      },
      teams: {
        home: {
          id: match.homeTeam.id,
          name: match.homeTeam.name ?? "TBD",
          logo: match.homeTeam.crest,
          winner: null
        },
        away: {
          id: match.awayTeam.id,
          name: match.awayTeam.name ?? "TBD",
          logo: match.awayTeam.crest,
          winner: null
        }
      },
      goals: {
        home: match.score?.fullTime?.home ?? null,
        away: match.score?.fullTime?.away ?? null
      }
    }));
  },
  completedMatches: async (options?: { competition?: string; season?: number }) => {
    const { competition, season } = resolvedFootballDataEnv(options);
    const data = await request<FootballDataCompetitionResponse>(
      `/competitions/${competition}/matches?season=${season}&status=FINISHED`,
      120
    );

    return data.matches.map((match) => ({
      fixture: {
        id: match.id,
        date: match.utcDate,
        status: {
          short: match.status,
          long: match.status
        },
        venue: {
          name: match.venue ?? undefined,
          city: match.area?.name
        }
      },
      league: {
        round: match.stage,
        group: match.group
      },
      teams: {
        home: {
          id: match.homeTeam.id,
          name: match.homeTeam.name ?? "TBD",
          logo: match.homeTeam.crest,
          winner: null
        },
        away: {
          id: match.awayTeam.id,
          name: match.awayTeam.name ?? "TBD",
          logo: match.awayTeam.crest,
          winner: null
        }
      },
      goals: {
        home: match.score?.fullTime?.home ?? null,
        away: match.score?.fullTime?.away ?? null
      }
    }));
  },
  teams: async (options?: { competition?: string; season?: number }) => {
    const { competition, season } = resolvedFootballDataEnv(options);
    const data = await request<FootballDataCompetitionResponse>(
      `/competitions/${competition}/teams?season=${season}`,
      86400
    );

    return data.teams.map((team) => ({
      team: {
        id: team.id,
        name: team.name,
        code: team.tla,
        country: undefined,
        logo: team.crest
      }
    }));
  },
  scorers: async (options?: { competition?: string; season?: number; limit?: number }) => {
    const { competition, season } = resolvedFootballDataEnv(options);
    const limit = options?.limit ?? 10;
    const data = await request<FootballDataScorersResponse>(
      `/competitions/${competition}/scorers?season=${season}&limit=${limit}`,
      900
    );

    return data.scorers.map((scorer) => ({
      id: scorer.player.id,
      name: scorer.player.name,
      nationality: scorer.player.nationality,
      team: {
        id: scorer.team.id,
        name: scorer.team.name ?? "TBD",
        code: scorer.team.tla,
        crest: scorer.team.crest
      },
      goals: scorer.goals ?? 0,
      assists: scorer.assists ?? 0,
      penalties: scorer.penalties ?? 0
    }));
  }
};

export type { FootballDataTeam, FootballDataMatch, FootballDataScorer };
