import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  API_FOOTBALL_KEY: z.string().optional(),
  API_FOOTBALL_LEAGUE_ID: z.coerce.number().int().positive().default(1),
  API_FOOTBALL_SEASON: z.coerce.number().int().positive().default(2026),
  FOOTBALL_DATA_API_KEY: z.string().optional(),
  FOOTBALL_DATA_COMPETITION_CODE: z.string().trim().min(1).default("WC"),
  FOOTBALL_DATA_SEASON: z.coerce.number().int().positive().default(2026),
  REDIS_URL: z.string().optional(),
  REDIS_TOKEN: z.string().optional(),
  SOCKET_SERVER_URL: z.string().url().optional(),
  CRON_SECRET: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  API_FOOTBALL_KEY: process.env.API_FOOTBALL_KEY,
  API_FOOTBALL_LEAGUE_ID: process.env.API_FOOTBALL_LEAGUE_ID,
  API_FOOTBALL_SEASON: process.env.API_FOOTBALL_SEASON,
  FOOTBALL_DATA_API_KEY: process.env.FOOTBALL_DATA_API_KEY,
  FOOTBALL_DATA_COMPETITION_CODE: process.env.FOOTBALL_DATA_COMPETITION_CODE,
  FOOTBALL_DATA_SEASON: process.env.FOOTBALL_DATA_SEASON,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_TOKEN: process.env.REDIS_TOKEN,
  SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL,
  CRON_SECRET: process.env.CRON_SECRET
});

export function resolvedFootballDataEnv(overrides?: {
  competition?: string;
  season?: number;
}) {
  return {
    competition: overrides?.competition?.trim() || env.FOOTBALL_DATA_COMPETITION_CODE,
    season: overrides?.season ?? env.FOOTBALL_DATA_SEASON
  };
}
