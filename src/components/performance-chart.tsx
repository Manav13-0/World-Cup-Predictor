"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PerformanceChart({ data }: { data: { label: string; points: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="points" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#009CDE" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#009CDE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" stroke="currentColor" tickLine={false} axisLine={false} />
          <YAxis stroke="currentColor" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#0B1220",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 8
            }}
          />
          <Area type="monotone" dataKey="points" stroke="#009CDE" fillOpacity={1} fill="url(#points)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
