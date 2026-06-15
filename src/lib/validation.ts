import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const predictionSchema = z
  .object({
    matchId: z.string().min(1),
    prediction: z.enum(["HOME_WIN", "AWAY_WIN", "DRAW"]),
    predictedHomeScore: z.number().int().min(0).max(30).nullable().optional(),
    predictedAwayScore: z.number().int().min(0).max(30).nullable().optional()
  })
  .refine((value) => value.predictedHomeScore !== undefined && value.predictedAwayScore !== undefined, {
    message: "Exact score predictions require both scores."
  });

export const leagueCreateSchema = z.object({
  name: z.string().trim().min(3).max(80)
});

export const leagueJoinSchema = z.object({
  code: z.string().trim().min(4).max(12)
});

export const manualMatchSchema = z.object({
  homeTeamName: z.string().trim().min(2).max(80),
  awayTeamName: z.string().trim().min(2).max(80),
  kickoff: z.string().min(1),
  stadium: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  round: z.string().trim().max(80).optional().or(z.literal("")),
  group: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"]).default("SCHEDULED"),
  homeScore: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(0).max(30).optional()
  ),
  awayScore: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(0).max(30).optional()
  )
});

export const matchQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12)
});
