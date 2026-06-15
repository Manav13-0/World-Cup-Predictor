import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { Button } from "@/components/ui/button";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIFA World Cup Prediction League",
  description: "A production-ready FIFA World Cup prediction league platform."
};

const nav = [
  { href: "/matches", label: "Matches" },
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
          <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,156,222,0.20),transparent_32rem)]">
            <header className="sticky top-0 z-40 border-b bg-background/86 backdrop-blur">
              <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
                    <Trophy size={19} />
                  </span>
                  <span>World Cup Predictor</span>
                </Link>
                <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
                  {nav.map((item) => (
                    <Link key={item.href} href={item.href} className="hover:text-foreground">
                      {item.label}
                    </Link>
                  ))}
                  {session?.user.role === "ADMIN" ? (
                    <Link href="/admin" className="hover:text-foreground">
                      Admin
                    </Link>
                  ) : null}
                </nav>
                <div className="flex items-center gap-2">
                  {session?.user ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link href="/dashboard">{session.user.name ?? "Account"}</Link>
                    </Button>
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
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
