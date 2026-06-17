import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, Trophy } from "lucide-react";

export default function RegisterPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 px-4 py-10 lg:grid-cols-[1fr_420px]">
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-card/80 to-card/70 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-100">
          <Sparkles size={12} />
          Create your squad
        </Badge>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">Build your account and start predicting every match.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Get access to leaderboards, private leagues, score tracking, and a smoother premium tournament dashboard.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Secure login", text: "Credential and Google auth supported." },
            { icon: Trophy, title: "Tournament ready", text: "Join the bracket in seconds." },
            { icon: Sparkles, title: "Premium UI", text: "Animated and responsive by design." }
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
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm mode="register" />
          <p className="mt-4 text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="text-violet-300">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
