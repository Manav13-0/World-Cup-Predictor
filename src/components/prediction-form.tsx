"use client";

import { useState } from "react";
import { PredictionType } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    <form onSubmit={submit} className="space-y-4">
      <Select name="prediction" disabled={locked} defaultValue="HOME_WIN">
        <option value="HOME_WIN">{formatPredictionLabel("HOME_WIN", homeTeamName, awayTeamName)}</option>
        <option value="DRAW">{formatPredictionLabel("DRAW", homeTeamName, awayTeamName)}</option>
        <option value="AWAY_WIN">{formatPredictionLabel("AWAY_WIN", homeTeamName, awayTeamName)}</option>
      </Select>
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
