"use client";

import { useEffect, useState } from "react";
import { Clock, Lock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchClockStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function liveMinute(kickoffMs: number, nowMs: number) {
  return Math.max(1, Math.floor((nowMs - kickoffMs) / 60000) + 1);
}

export function MatchClock({
  kickoff,
  status,
  compact = false,
  className
}: {
  kickoff: Date | string;
  status: MatchClockStatus;
  compact?: boolean;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const kickoffMs = new Date(kickoff).getTime();
  const activeNowMs = nowMs ?? kickoffMs;
  const millisecondsUntilKickoff = kickoffMs - activeNowMs;

  useEffect(() => {
    setNowMs(Date.now());
    const interval = window.setInterval(() => setNowMs(Date.now()), status === "LIVE" ? 30_000 : 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  let icon = <Clock size={compact ? 14 : 16} />;
  let label = "Prediction locked";
  let detail = "Kickoff reached";
  let tone = "border-amber-300/20 bg-amber-400/10 text-amber-100";

  if (status === "LIVE") {
    icon = <Radio className="animate-pulse" size={compact ? 14 : 16} />;
    label = nowMs ? `Live ${liveMinute(kickoffMs, activeNowMs)}'` : "Live";
    detail = "Updating automatically";
    tone = "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  } else if (status === "SCHEDULED" && !nowMs) {
    label = "Prediction closes at kickoff";
    detail = "Countdown starting";
    tone = "border-violet-300/20 bg-violet-400/10 text-violet-100";
  } else if (status === "SCHEDULED" && millisecondsUntilKickoff > 0) {
    label = `Locks in ${formatCountdown(millisecondsUntilKickoff)}`;
    detail = "Predict before kickoff";
    tone = millisecondsUntilKickoff <= 30 * 60 * 1000
      ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
      : "border-violet-300/20 bg-violet-400/10 text-violet-100";
  } else if (status === "FINISHED") {
    icon = <Lock size={compact ? 14 : 16} />;
    label = "Final";
    detail = "Predictions closed";
    tone = "border-slate-300/20 bg-slate-400/10 text-slate-100";
  } else if (status === "CANCELLED") {
    icon = <Lock size={compact ? 14 : 16} />;
    label = "Cancelled";
    detail = "No predictions";
    tone = "border-slate-300/20 bg-slate-400/10 text-slate-100";
  }

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-2xl border px-3 py-2", tone, className)}>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className={cn("block font-semibold leading-tight", compact ? "text-xs" : "text-sm")}>{label}</span>
        {!compact ? <span className="block text-xs opacity-75">{detail}</span> : null}
      </span>
    </div>
  );
}
