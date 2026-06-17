import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 px-4 py-10 lg:grid-cols-[1fr_420px]">
      <div className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-100">
          <Sparkles size={12} />
          Premium World Cup Experience
        </Badge>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">Sign in and keep your predictions in the race.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Track your form, join private leagues, and watch live standings update as the tournament unfolds.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Trophy, title: "Earn points", text: "Exact scores and winners both matter." },
            { icon: Users, title: "Join leagues", text: "Compete with friends in private rooms." },
            { icon: Sparkles, title: "Live updates", text: "Responsive sync and polished motion." }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-card/75 p-4">
              <item.icon size={18} />
              <p className="mt-3 font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="text-violet-300">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
