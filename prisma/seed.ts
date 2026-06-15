import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const teams = [
  { apiTeamId: 1001, name: "Argentina", shortName: "Argentina", code: "ARG", fifaRanking: 1 },
  { apiTeamId: 1002, name: "France", shortName: "France", code: "FRA", fifaRanking: 2 },
  { apiTeamId: 1003, name: "Brazil", shortName: "Brazil", code: "BRA", fifaRanking: 5 },
  { apiTeamId: 1004, name: "England", shortName: "England", code: "ENG", fifaRanking: 4 },
  { apiTeamId: 1005, name: "Spain", shortName: "Spain", code: "ESP", fifaRanking: 8 },
  { apiTeamId: 1006, name: "Germany", shortName: "Germany", code: "GER", fifaRanking: 16 }
];

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@predictionleague.local" },
    create: {
      name: "Tournament Admin",
      email: "admin@predictionleague.local",
      password: await bcrypt.hash("AdminPass123!", 12),
      role: Role.ADMIN
    },
    update: { role: Role.ADMIN }
  });

  const users = await Promise.all(
    ["Maya", "Leo", "Aarav", "Sofia"].map((name, index) =>
      prisma.user.upsert({
        where: { email: `${name.toLowerCase()}@predictionleague.local` },
        create: {
          name,
          email: `${name.toLowerCase()}@predictionleague.local`,
          password: bcrypt.hashSync("UserPass123!", 12),
          totalPoints: 10 - index * 2,
          correctPredictions: 5 - index
        },
        update: {}
      })
    )
  );

  const dbTeams = await Promise.all(
    teams.map((team) =>
      prisma.team.upsert({
        where: { apiTeamId: team.apiTeamId },
        create: team,
        update: team
      })
    )
  );

  const now = Date.now();
  const matches = [
    [dbTeams[0], dbTeams[1], 1, "Group A", "MetLife Stadium", "New Jersey"],
    [dbTeams[2], dbTeams[3], 2, "Group B", "AT&T Stadium", "Dallas"],
    [dbTeams[4], dbTeams[5], 3, "Group C", "SoFi Stadium", "Los Angeles"]
  ] as const;

  for (const [homeTeam, awayTeam, fixtureId, group, stadium, city] of matches) {
    await prisma.match.upsert({
      where: { apiMatchId: 9000 + fixtureId },
      create: {
        apiMatchId: 9000 + fixtureId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        round: "Group Stage",
        group,
        stadium,
        city,
        status: "SCHEDULED",
        kickoff: new Date(now + fixtureId * 86_400_000)
      },
      update: {}
    });
  }

  const league = await prisma.league.upsert({
    where: { code: "WORLD26" },
    create: {
      name: "World Cup Friends",
      code: "WORLD26",
      ownerId: admin.id
    },
    update: {}
  });

  for (const user of [admin, ...users]) {
    await prisma.leagueMember.upsert({
      where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
      create: { leagueId: league.id, userId: user.id },
      update: {}
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
