// import Image from "next/image";
// import { ShieldCheck, TrendingUp, Trophy } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { PageShell } from "@/components/page-shell";
// import { getStandings, type QualificationState, type TeamStanding } from "@/lib/tournament";
// import { cn } from "@/lib/utils";

// function TeamIdentity({ row }: { row: TeamStanding }) {
//   return (
//     <div className="flex min-w-0 items-center gap-3">
//       {row.team.flag ? (
//         <Image src={row.team.flag} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
//       ) : (
//         <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold">
//           {row.team.name.slice(0, 2).toUpperCase()}
//         </span>
//       )}
//       <div className="min-w-0">
//         <p className="truncate font-semibold">{row.team.name}</p>
//         <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{row.team.code ?? "WC"}</p>
//       </div>
//     </div>
//   );
// }

// function QualificationBadge({ state }: { state: QualificationState }) {
//   if (state === "qualified") {
//     return <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-100">Qualifying</Badge>;
//   }

//   if (state === "third-place") {
//     return <Badge className="border-amber-300/20 bg-amber-400/10 text-amber-100">Best 3rd race</Badge>;
//   }

//   return <Badge className="border-white/10 bg-white/5 text-muted-foreground">Chasing</Badge>;
// }

// export default async function StandingsPage() {
//   const groups = await getStandings();
//   const groupCount = groups.length;
//   const teamCount = groups.reduce((total, group) => total + group.rows.length, 0);
//   const finishedGroupMatches = groups.reduce(
//     (total, group) => total + group.matches.filter((match) => match.status === "FINISHED").length,
//     0
//   );

//   return (
//     <PageShell
//       title="Standings"
//       description="Group tables update from finished fixtures with points, goal difference, and qualification status."
//     >
//       <div className="mb-6 grid gap-4 md:grid-cols-3">
//         {[
//           { label: "Groups", value: groupCount, icon: Trophy },
//           { label: "Teams", value: teamCount, icon: ShieldCheck },
//           { label: "Finished group matches", value: finishedGroupMatches, icon: TrendingUp }
//         ].map((stat) => (
//           <Card key={stat.label}>
//             <CardContent className="flex items-center justify-between gap-4 p-5">
//               <div>
//                 <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{stat.label}</p>
//                 <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
//               </div>
//               <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-amber-100">
//                 <stat.icon size={20} />
//               </span>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {groups.length ? (
//         <div className="grid gap-5 xl:grid-cols-2">
//           {groups.map((group) => (
//             <Card key={group.key}>
//               <CardHeader className="flex-row items-center justify-between gap-3">
//                 <div>
//                   <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">World Cup Group</p>
//                   <CardTitle className="mt-2">{group.label}</CardTitle>
//                 </div>
//                 <Badge className="border-white/10 bg-white/5 text-muted-foreground">{group.matches.length} matches</Badge>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid gap-3 md:hidden">
//                   {group.rows.map((row) => (
//                     <div
//                       key={row.team.id}
//                       className={cn(
//                         "rounded-2xl border p-4",
//                         row.qualification === "qualified"
//                           ? "border-emerald-300/20 bg-emerald-400/10"
//                           : "border-white/10 bg-white/[0.04]"
//                       )}
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <TeamIdentity row={row} />
//                         <div className="text-right">
//                           <p className="text-xs text-muted-foreground">Pts</p>
//                           <p className="text-2xl font-semibold">{row.points}</p>
//                         </div>
//                       </div>
//                       <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
//                         {[
//                           ["P", row.played],
//                           ["W", row.wins],
//                           ["GD", row.goalDifference],
//                           ["GF", row.goalsFor]
//                         ].map(([label, value]) => (
//                           <div key={label} className="rounded-xl border border-white/10 bg-background/35 p-2">
//                             <p className="text-[10px] text-muted-foreground">{label}</p>
//                             <p className="font-semibold">{value}</p>
//                           </div>
//                         ))}
//                       </div>
//                       <div className="mt-3">
//                         <QualificationBadge state={row.qualification} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="hidden overflow-x-auto md:block">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Team</TableHead>
//                         <TableHead className="text-center">P</TableHead>
//                         <TableHead className="text-center">W</TableHead>
//                         <TableHead className="text-center">D</TableHead>
//                         <TableHead className="text-center">L</TableHead>
//                         <TableHead className="text-center">GF</TableHead>
//                         <TableHead className="text-center">GA</TableHead>
//                         <TableHead className="text-center">GD</TableHead>
//                         <TableHead className="text-center">Pts</TableHead>
//                         <TableHead>Status</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {group.rows.map((row) => (
//                         <TableRow key={row.team.id}>
//                           <TableCell>
//                             <TeamIdentity row={row} />
//                           </TableCell>
//                           <TableCell className="text-center">{row.played}</TableCell>
//                           <TableCell className="text-center">{row.wins}</TableCell>
//                           <TableCell className="text-center">{row.draws}</TableCell>
//                           <TableCell className="text-center">{row.losses}</TableCell>
//                           <TableCell className="text-center">{row.goalsFor}</TableCell>
//                           <TableCell className="text-center">{row.goalsAgainst}</TableCell>
//                           <TableCell className="text-center">{row.goalDifference}</TableCell>
//                           <TableCell className="text-center font-semibold">{row.points}</TableCell>
//                           <TableCell>
//                             <QualificationBadge state={row.qualification} />
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Card>
//           <CardContent className="p-8 text-center">
//             <p className="text-lg font-semibold">No group-stage fixtures synced yet.</p>
//             <p className="mt-2 text-sm text-muted-foreground">Use Admin Sync Fixtures to load World Cup group data.</p>
//           </CardContent>
//         </Card>
//       )}
//     </PageShell>
//   );
// }








import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStandings, type QualificationState, type TeamStanding } from "@/lib/tournament";
import { cn } from "@/lib/utils";

function TeamIdentity({ row }: { row: TeamStanding }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {row.team.flag ? (
        <Image src={row.team.flag} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold">
          {row.team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold">{row.team.name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{row.team.code ?? "WC"}</p>
      </div>
    </div>
  );
}

function QualificationBadge({ state }: { state: QualificationState }) {
  if (state === "qualified") {
    return <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-100">Qualifying</Badge>;
  }

  if (state === "third-place") {
    return <Badge className="border-amber-300/20 bg-amber-400/10 text-amber-100">Best 3rd race</Badge>;
  }

  return <Badge className="border-white/10 bg-white/5 text-muted-foreground">Chasing</Badge>;
}

export default async function StandingsPage() {
  const groups = await getStandings();

  return (
    <>
      {groups.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.key}>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">World Cup Group</p>
                  <CardTitle className="mt-2">{group.label}</CardTitle>
                </div>
                <Badge className="border-white/10 bg-white/5 text-muted-foreground">{group.matches.length} matches</Badge>
              </CardHeader>
              <CardContent>
                {/* Mobile - compact */}
{/* Mobile - compact */}
<div className="grid gap-1 md:hidden">
  {/* Column headers */}
  <div className="flex items-center gap-3 px-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
    <span className="w-4" />
    <span className="w-5" />
    <span className="flex-1" />
    <div className="flex items-center gap-3 text-center">
      <span className="w-4">P</span>
      <span className="w-4">W</span>
      <span className="w-4">D</span>
      <span className="w-4">L</span>
      <span className="w-6">GD</span>
      <span className="w-6">Pts</span>
    </div>
  </div>

  {group.rows.map((row, index) => (
    <div
      key={row.team.id}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        row.qualification === "qualified"
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-white/10 bg-white/[0.04]"
      )}
    >
      <span className="w-4 shrink-0 text-center text-xs font-semibold text-muted-foreground">
        {index + 1}
      </span>
      {row.team.flag ? (
        <Image src={row.team.flag} alt="" width={22} height={22} className="h-5 w-5 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[9px] font-semibold">
          {row.team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{row.team.name}</p>
      </div>
      <div className="flex items-center gap-3 text-center text-xs text-muted-foreground">
        <span className="w-4">{row.played}</span>
        <span className="w-4">{row.wins}</span>
        <span className="w-4">{row.draws}</span>
        <span className="w-4">{row.losses}</span>
        <span className="w-6 font-semibold text-foreground">
          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
        </span>
        <span className="w-6 font-bold text-base text-foreground">{row.points}</span>
      </div>
    </div>
  ))}
</div>
                {/* Desktop */}
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">GF</TableHead>
                        <TableHead className="text-center">GA</TableHead>
                        <TableHead className="text-center">GD</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.rows.map((row) => (
                        <TableRow key={row.team.id}>
                          <TableCell><TeamIdentity row={row} /></TableCell>
                          <TableCell className="text-center">{row.played}</TableCell>
                          <TableCell className="text-center">{row.wins}</TableCell>
                          <TableCell className="text-center">{row.draws}</TableCell>
                          <TableCell className="text-center">{row.losses}</TableCell>
                          <TableCell className="text-center">{row.goalsFor}</TableCell>
                          <TableCell className="text-center">{row.goalsAgainst}</TableCell>
                          <TableCell className="text-center">{row.goalDifference}</TableCell>
                          <TableCell className="text-center font-semibold">{row.points}</TableCell>
                          <TableCell><QualificationBadge state={row.qualification} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold">No group-stage fixtures synced yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Use Admin Sync Fixtures to load World Cup group data.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}