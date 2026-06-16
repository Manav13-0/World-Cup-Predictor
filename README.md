# FIFA World Cup Prediction League

Production-style full-stack FIFA World Cup prediction league built with Next.js 15, TypeScript, Prisma MongoDB, NextAuth v5, Redis caching, API-Football sync, Socket.io, Tailwind CSS, and Shadcn-style UI primitives.

## Features

- Credentials and Google OAuth login with JWT sessions.
- MongoDB models for users, teams, matches, predictions, leagues, and memberships.
- Match search, match details, exact score predictions, kickoff locking, and history.
- Prediction scoring engine with 2 points for winner or draw and 5 points for exact score.
- Redis-backed leaderboard ordered by points, correct predictions, and signup date.
- API-Football service with retry, caching, sync jobs, and admin sync controls.
- Vercel cron routes for fixture, live score, and result sync.
- Socket.io event bridge for match, prediction, points, rank, and leaderboard updates.
- Docker, docker-compose, GitHub Actions, seed data, and Vercel config.

## Getting Started

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Open `http://localhost:3000`.

Seeded accounts:

- Admin: `admin@predictionleague.local` / `AdminPass123!`
- User: `maya@predictionleague.local` / `UserPass123!`

## Environment

Required for the application:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Required for external integrations:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
API_FOOTBALL_KEY=
REDIS_URL=
REDIS_TOKEN=
SOCKET_SERVER_URL=
CRON_SECRET=
```

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/matches`
- `GET /api/matches/[id]`
- `POST /api/predictions`
- `GET /api/predictions/me`
- `GET /api/leaderboard`
- `GET /api/dashboard`
- `GET /api/leagues`
- `POST /api/leagues`
- `GET /api/leagues/[id]`
- `POST /api/admin/sync-fixtures`
- `POST /api/admin/sync-results`
- `GET /api/cron/sync-fixtures`
- `GET /api/cron/live-sync`
- `GET /api/cron/sync-results`

## Cron Jobs

Configured in `vercel.json` for Vercel Hobby compatibility:

- Fixture sync once per day.
- Live sync once per day.
- Result sync once per day.

For more frequent syncs, use the admin sync buttons or upgrade to Pro.

If `CRON_SECRET` is set, call cron routes with:

```bash
Authorization: Bearer your-secret
```

## Socket Server

Run the Socket.io bridge separately in local or container deployments:

```bash
npm run socket
```

Set `SOCKET_SERVER_URL` and `NEXT_PUBLIC_SOCKET_SERVER_URL` to the live socket host in production.

## Production Deployment

1. Create MongoDB Atlas database and set `DATABASE_URL`.
2. Create a strong `NEXTAUTH_SECRET` and set `NEXTAUTH_URL` to the production URL.
3. Add Google OAuth credentials if Google login is enabled.
4. Add API-Football key for fixture, live, and result sync.
5. Add Upstash Redis credentials for durable rate limiting and leaderboard cache.
6. Deploy the Next.js app to Vercel.
7. Deploy the Socket.io server as a separate Node service or container.
8. Run `npx prisma db push` against production MongoDB.
9. Run `npm run seed` only if demo data is desired.

## Docker

```bash
docker compose up --build
```

The compose file starts the Next.js app, Socket.io bridge, and Redis.
