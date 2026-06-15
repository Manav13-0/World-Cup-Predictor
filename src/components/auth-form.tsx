"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    if (mode === "register") {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password")
        })
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" ? <Input name="name" required placeholder="Full name" autoComplete="name" /> : null}
      <Input name="email" required type="email" placeholder="Email" autoComplete="email" />
      <Input name="password" required type="password" placeholder="Password" autoComplete="current-password" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={16} /> : null}
        {mode === "login" ? "Login" : "Create Account"}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
        Continue with Google
      </Button>
    </form>
  );
}
