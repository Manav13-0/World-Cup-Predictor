import { cacheGet, cacheSet } from "@/lib/redis";
import { env } from "@/lib/env";

const BASE_URL = "https://v3.football.api-sports.io";

type ApiFootballResponse<T> = {
  response: T[];
  errors: unknown;
};

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
    venue?: { name?: string; city?: string };
  };
  league: { round?: string; group?: string | null };
  teams: {
    home: { id: number | null; name: string; logo?: string; winner?: boolean | null };
    away: { id: number | null; name: string; logo?: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
};

type ApiTeam = {
  team: {
    id: number | null;
    name: string;
    code?: string;
    country?: string;
    logo?: string;
  };
};

type ApiFixtureEvent = {
  time?: {
    elapsed?: number | null;
    extra?: number | null;
  };
  team?: {
    id?: number | null;
    name?: string;
    logo?: string;
  };
  player?: {
    id?: number | null;
    name?: string;
  };
  assist?: {
    id?: number | null;
    name?: string;
  };
  type?: string;
  detail?: string;
  comments?: string | null;
};

function assertApiKey() {
  if (!env.API_FOOTBALL_KEY) {
    throw new Error("API_FOOTBALL_KEY is required for fixture synchronization.");
  }
}

async function request<T>(path: string, ttlSeconds = 60, retries = 2): Promise<T[]> {
  assertApiKey();

  const cacheKey = `api-football:${path}`;
  const cached = await cacheGet<T[]>(cacheKey);
  if (cached) return cached;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
          "x-apisports-key": env.API_FOOTBALL_KEY ?? ""
        },
        next: { revalidate: ttlSeconds }
      });

      if (!response.ok) {
        throw new Error(`API-Football request failed with ${response.status}`);
      }

      const data = (await response.json()) as ApiFootballResponse<T>;
      await cacheSet(cacheKey, data.response, ttlSeconds);
      return data.response;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("API-Football request failed.");
}

export const apiFootball = {
  fixtures: () =>
    request<ApiFixture>(`/fixtures?league=${env.API_FOOTBALL_LEAGUE_ID}&season=${env.API_FOOTBALL_SEASON}`, 300),
  liveMatches: () =>
    request<ApiFixture>(`/fixtures?league=${env.API_FOOTBALL_LEAGUE_ID}&season=${env.API_FOOTBALL_SEASON}&live=all`, 15),
  completedMatches: () =>
    request<ApiFixture>(
      `/fixtures?league=${env.API_FOOTBALL_LEAGUE_ID}&season=${env.API_FOOTBALL_SEASON}&status=FT-AET-PEN`,
      120
    ),
  teams: () => request<ApiTeam>(`/teams?league=${env.API_FOOTBALL_LEAGUE_ID}&season=${env.API_FOOTBALL_SEASON}`, 86400)
  ,
  events: (fixtureId: number) => request<ApiFixtureEvent>(`/fixtures/events?fixture=${fixtureId}`, 60)
};

export type { ApiFixture, ApiTeam, ApiFixtureEvent };
