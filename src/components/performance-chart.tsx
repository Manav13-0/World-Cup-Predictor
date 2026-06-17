"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PerformanceChart({ data }: { data: { label: string; points: number }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="h-80 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.04] to-transparent p-3 backdrop-blur-xl"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="points" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.88} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 8" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" stroke="currentColor" tickLine={false} axisLine={false} />
          <YAxis stroke="currentColor" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(8, 12, 22, 0.96)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              boxShadow: "0 20px 80px rgba(0,0,0,0.35)"
            }}
          />
          <Area type="monotone" dataKey="points" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#points)" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
