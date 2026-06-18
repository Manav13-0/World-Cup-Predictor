"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type TeamOption = {
  id: string;
  name: string;
  code: string | null;
};

export function FavoriteTeamForm({
  teams,
  currentFavoriteTeamId
}: {
  teams: TeamOption[];
  currentFavoriteTeamId: string | null;
}) {
  const router = useRouter();
  const [favoriteTeamId, setFavoriteTeamId] = useState(currentFavoriteTeamId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/profile/favorite-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoriteTeamId: favoriteTeamId || null })
    });

    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Could not save favorite team.");
      return;
    }

    setMessage("Favorite team updated.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Favorite team
        </span>
        <select
          value={favoriteTeamId}
          onChange={(event) => setFavoriteTeamId(event.target.value)}
          className="h-11 w-full rounded-2xl border border-white/10 bg-background px-4 text-sm outline-none transition focus:border-violet-400/40"
        >
          <option value="">No favorite team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} {team.code ? `(${team.code})` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Save team
        </Button>
        <Button type="button" variant="outline" onClick={() => setFavoriteTeamId("")} disabled={saving}>
          <Star size={16} />
          Clear
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
