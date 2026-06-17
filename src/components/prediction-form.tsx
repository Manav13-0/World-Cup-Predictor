"use client";

import { useState } from "react";
import { PredictionType } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPredictionLabel } from "@/lib/utils";

export function PredictionForm({
  matchId,
  locked,
  homeTeamName,
  awayTeamName
}: {
  matchId: string;
  locked: boolean;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionType>("HOME_WIN");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        prediction: form.get("prediction") as PredictionType,
        predictedHomeScore: Number(form.get("predictedHomeScore")),
        predictedAwayScore: Number(form.get("predictedAwayScore"))
      })
    });

    const body = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Prediction saved." : body.error ?? "Could not save prediction.");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <input type="hidden" name="prediction" value={prediction} />
      <div className="grid gap-2">
        {(["HOME_WIN", "DRAW", "AWAY_WIN"] as PredictionType[]).map((option) => {
          const active = prediction === option;
          return (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => setPrediction(option)}
              className={[
                "relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-300",
                active
                  ? "border-violet-400/40 bg-gradient-to-r from-violet-400/[0.18] to-amber-400/[0.14] text-foreground shadow-[0_18px_40px_rgba(139,92,246,0.18)]"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/[0.08]"
              ].join(" ")}
            >
              {active ? (
                <motion.span
                  layoutId="prediction-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-400/10 to-amber-400/10"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              ) : null}
              <span className="relative z-10 text-sm font-medium">{formatPredictionLabel(option, homeTeamName, awayTeamName)}</span>
              <span className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.3em]">
                {active ? "Selected" : "Choose"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input name="predictedHomeScore" type="number" min={0} max={30} defaultValue={1} disabled={locked} />
        <Input name="predictedAwayScore" type="number" min={0} max={30} defaultValue={0} disabled={locked} />
      </div>
      <Button className="w-full" disabled={locked || loading}>
        <CheckCircle2 size={16} />
        {locked ? "Prediction Locked" : "Save Prediction"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
