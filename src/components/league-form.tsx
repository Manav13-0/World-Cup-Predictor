"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LeagueForms() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function submit(payload: Record<string, string>) {
    const response = await fetch("/api/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    setMessage(response.ok ? "League updated." : body.error ?? "Could not update league.");
    router.refresh();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submit({ name: String(form.get("name")) });
        }}
      >
        <Input name="name" placeholder="Create league name" required />
        <Button>
          <Plus size={16} />
          Create
        </Button>
      </form>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submit({ code: String(form.get("code")).toUpperCase() });
        }}
      >
        <Input name="code" placeholder="Join code" required />
        <Button variant="secondary">
          <UserPlus size={16} />
          Join
        </Button>
      </form>
      {message ? <p className="text-sm text-muted-foreground md:col-span-2">{message}</p> : null}
    </div>
  );
}
