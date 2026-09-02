"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Code, Swords, Trophy, BotMessageSquare, Sparkles, Flame, ShieldCheck, Zap, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAuthenticated } from "@/lib/auth";

const features = [
  {
    title: "Concept Skill Trees",
    description: "Progress through structured DSA tracks from Arrays to Dynamic Programming with granular mastery analytics.",
    icon: Code,
    href: "/practice",
    badge: "Roadmap",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
  },
  {
    title: "Real-Time 1v1 Battles",
    description: "Challenge peers or AI in live synchronized coding duels with instant sandbox evaluation and Elo ratings.",
    icon: Swords,
    href: "/battle",
    badge: "Competitive",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20"
  },
  {
    title: "Ranked Global Elo",
    description: "Climb competitive tiers from Bronze to Grandmaster with server-authoritative matchmaking.",
    icon: Trophy,
    href: "/leaderboard",
    badge: "Ranked",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  },
  {
    title: "Senior AI Code Explainer",
    description: "Receive line-by-line breakdowns, asymptotic complexity audits, and guided hint progressions.",
    icon: BotMessageSquare,
    href: "/explainer",
    badge: "AI Guidance",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
  }
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Landing Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 max-w-6xl items-center justify-between px-4 mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Logo className="h-4 w-4" />
            </div>
            <span className="font-headline font-bold text-base text-foreground">CodeClash</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm" className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border">
          <div className="container relative z-10 px-4 md:px-6 mx-auto text-center space-y-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-mono text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Competitive DSA & Real-Time Duels</span>
            </div>

            <h1 className="text-4xl font-extrabold font-headline tracking-tight sm:text-6xl md:text-7xl text-foreground">
              Master Algorithmic Coding in{" "}
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Real-Time Battles
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
              Transform interview prep into an engaging sport. Level up through structured concept trees, test against hidden judge cases, and duel live opponents.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-11 px-6 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-[1.02]">
                  Enter Arena <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/practice" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-6 text-sm font-semibold border-border bg-background hover:bg-muted/50">
                  Explore Problem Catalog
                </Button>
              </Link>
            </div>

            {/* Feature Badges */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs font-mono text-muted-foreground">
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card border border-border shadow-xs">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>Instant Sandbox</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card border border-border shadow-xs">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>Daily Streaks</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card border border-border shadow-xs">
                <Swords className="h-3.5 w-3.5 text-purple-500" />
                <span>1v1 Live Duels</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card border border-border shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Hidden Test Cases</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="text-center space-y-2 mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-foreground">
                Engineered for Algorithmic Mastery
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-xs sm:text-sm">
                Clean, focused tools designed to build deep problem-solving intuition.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {features.map((f) => (
                <Card key={f.title} className="bg-card border-border hover:border-primary/40 transition-all hover:shadow-md group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${f.color}`}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {f.badge}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-2">
                    <CardTitle className="text-base font-bold font-headline text-foreground group-hover:text-primary transition-colors">
                      {f.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-card text-xs text-muted-foreground">
        <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 max-w-6xl">
          <div className="flex items-center gap-2">
            <Logo className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">CodeClash</span>
            <span>— Server-Authoritative DSA eSports</span>
          </div>
          <p>© {new Date().getFullYear()} CodeClash. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
