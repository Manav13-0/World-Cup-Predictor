"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: string;
  rank: number;
  name: string;
  correctPredictions: number;
  totalPoints: number;
};

export function LeaderboardTable({ rows }: { rows: Row[] }) {
  return (
    <>
      <div className="grid gap-3 p-3 sm:hidden">
        {rows.map((row, index) => {
          const medal = index === 0 ? "Gold" : index === 1 ? "Silver" : index === 2 ? "Bronze" : null;

          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: Math.min(index * 0.02, 0.18) }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">#{row.rank}</span>
                    {medal ? (
                      <Badge className="border-violet-300/20 bg-violet-400/15 text-[10px] uppercase tracking-[0.25em] text-violet-100">
                        {medal}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 break-words text-xl font-semibold leading-tight text-foreground">{row.name}</p>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-100/70">Points</p>
                  <p className="text-2xl font-semibold text-amber-100">{row.totalPoints}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-background/35 p-3">
                  <p className="text-xs text-muted-foreground">Correct picks</p>
                  <p className="mt-1 text-2xl font-semibold">{row.correctPredictions}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-background/35 p-3">
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="mt-1 text-2xl font-semibold">#{row.rank}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Correct</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const medal = index === 0 ? "Gold" : index === 1 ? "Silver" : index === 2 ? "Bronze" : null;

              return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(index * 0.02, 0.18) }}
                  className="border-b border-white/10"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.rank}</span>
                      {medal ? (
                        <Badge className="border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.3em]">
                          {medal}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.correctPredictions}</TableCell>
                  <TableCell className="text-right font-semibold">{row.totalPoints}</TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
