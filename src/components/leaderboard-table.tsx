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
                  {medal ? <Badge className="border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.3em]">{medal}</Badge> : null}
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
  );
}
