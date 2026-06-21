import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { PageTransition } from "@/components/page-transition";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

// export const metadata: Metadata = {
//   title: "FIFA World Cup Prediction League",
//   description: "A production-ready FIFA World Cup prediction league platform."
// };

export const metadata: Metadata = {
  title: "FIFA World Cup Prediction League",
  description: "A production-ready FIFA World Cup prediction league platform.",
  icons: {
    icon: "/fifa-world-cup-2026-logo.png",
  },
};
const nav = [
  { href: "/live", label: "Live" },
  { href: "/matches", label: "Matches" },
  { href: "/standings", label: "Standings" },
  { href: "/bracket", label: "Bracket" },
  { href: "/compare", label: "Compare" },
  { href: "/stats", label: "Stats" },
  { href: "/profile", label: "Profile" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/leagues", label: "Leagues" },
  { href: "/dashboard", label: "Dashboard" }
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="relative min-h-screen overflow-x-hidden">
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-violet-500/18 blur-3xl animate-pulse-soft" />
              <div className="absolute right-[-8rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-amber-300/12 blur-3xl animate-float" />
              <div className="absolute bottom-[-10rem] left-[18%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/12 blur-3xl animate-pulse-soft" />
            </div>

            <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
                <Link href="/" className="group flex items-center gap-3 font-semibold">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-[0_18px_40px_rgba(0,156,222,0.25)] transition-transform duration-300 group-hover:-translate-y-0.5">
                    <Trophy size={19} />
                  </span>
                  <span className="hidden flex-col leading-tight sm:flex">
                    <span className="flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-muted-foreground">
                      <Sparkles size={12} />
                      Premium League
                    </span>
                    <span className="text-base">World Cup Predictor</span>
                  </span>
                </Link>

                <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground backdrop-blur-xl md:flex">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-white/10 hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                  {session?.user.role === "ADMIN" ? (
                    <Link href="/admin" className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-white/10 hover:text-foreground">
                      Admin
                    </Link>
                  ) : null}
                </nav>

                <div className="flex items-center gap-2">
                  <MobileNav items={nav} isAdmin={session?.user.role === "ADMIN"} />
                  {session?.user ? (
                    <>
                      <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
                        <Link href="/dashboard">
                          <Crown size={14} />
                          {session.user.name ?? "Account"}
                        </Link>
                      </Button>
                      <LogoutButton />
                    </>
                  ) : (
                    <>
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href="/register">Register</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </header>

            <main className="relative">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
