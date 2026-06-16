"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AdminActions() {
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function sync(path: string, body?: Record<string, string>) {
    setMessage("Sync running...");
    const response = await fetch(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json();
    setMessage(
      response.ok
        ? `Synced ${payload.synced} records using ${payload.provider} (${payload.competition} / ${payload.season}).`
        : payload.error ?? "Sync failed."
    );
  }

  async function createManualMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("Creating match...");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/manual-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeTeamName: form.get("homeTeamName"),
        awayTeamName: form.get("awayTeamName"),
        kickoff: form.get("kickoff"),
        stadium: form.get("stadium"),
        city: form.get("city"),
        round: form.get("round"),
        group: form.get("group"),
        status: form.get("status"),
        homeScore: form.get("homeScore"),
        awayScore: form.get("awayScore")
      })
    });

    const body = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Manual match created." : body.error ?? "Could not create match.");
    if (response.ok) {
      event.currentTarget.reset();
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-md border p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          sync("/api/admin/sync-fixtures", {
            competition: String(form.get("competition") ?? "WC"),
            season: String(form.get("season") ?? "2026")
          });
        }}
      >
        <Input name="competition" placeholder="Competition code" defaultValue="WC" />
        <Input name="season" placeholder="Season" defaultValue="2026" />
        <Button className="md:col-span-2" type="submit">
          <RefreshCw size={16} />
          Sync With Selection
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => sync("/api/admin/sync-fixtures")}>
          <RefreshCw size={16} />
          Sync Fixtures
        </Button>
        <Button variant="secondary" onClick={() => sync("/api/admin/sync-results")}>
          <RefreshCw size={16} />
          Sync Results
        </Button>
      </div>

      <form onSubmit={createManualMatch} className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
        <Input name="homeTeamName" placeholder="Home team" required />
        <Input name="awayTeamName" placeholder="Away team" required />
        <Input name="kickoff" type="datetime-local" required />
        <Select name="status" defaultValue="SCHEDULED">
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="FINISHED">Finished</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Input name="stadium" placeholder="Stadium" />
        <Input name="city" placeholder="City" />
        <Input name="round" placeholder="Round" />
        <Input name="group" placeholder="Group" />
        <Input name="homeScore" type="number" min={0} max={30} placeholder="Home score" />
        <Input name="awayScore" type="number" min={0} max={30} placeholder="Away score" />
        <Button className="md:col-span-2" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Create Manual Match
        </Button>
      </form>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
