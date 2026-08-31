"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Code, Swords, Trophy, BotMessageSquare, Sparkles, Flame, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/icons";
import { isAuthenticated } from "@/lib/auth";

const features = [
  {
    title: "Concept Skill Trees",
    description: "Progress through structured DSA levels from Arrays to Dynamic Programming with independent mastery tracking.",
    icon: Code,
    href: "/practice",
    badge: "Roadmap"
  },
  {
    title: "Real-Time 1v1 Battles",
    description: "Challenge peers to live synchronized coding duels. First to solve wins rating, XP, and glory.",
    icon: Swords,
    href: "/battle",
    badge: "Competitive"
  },
  {
    title: "Global Elo Leaderboards",
    description: "Climb the ranks from Bronze to Grandmaster with a server-authoritative Elo rating system.",
    icon: Trophy,
    href: "/leaderboard",
    badge: "Ranked"
  },
  {
    title: "AI Code Explainer",
    description: "Get senior-engineer-grade line-by-line breakdowns, complexity analysis, and edge case detection.",
    icon: BotMessageSquare,
    href: "/explainer",
    badge: "AI Powered"
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
    <div className="flex flex-col min-h-screen bg-[#121214] text-foreground selection:bg-purple-500 selection:text-white">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 border-b border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,0,255,0.25),rgba(255,255,255,0))]" />
          <div className="container relative z-10 px-4 md:px-6 mx-auto text-center space-y-8 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-4 py-1.5 text-xs font-mono text-purple-300 backdrop-blur-md shadow-lg shadow-purple-900/20">
              <Sparkles className="h-3.5 w-3.5 text-accent animate-spin" />
              <span>Next-Gen Competitive DSA Platform</span>
            </div>

            <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
              Master DSA Through{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-[#BF00FF] bg-clip-text text-transparent">
                Real-Time Battles
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed">
              Transform monotonous coding practice into an exhilarating eSport. Level up through concept skill trees, earn achievements, and compete in 1v1 coding duels.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-bold bg-gradient-to-r from-[#4B0082] to-[#BF00FF] hover:from-[#5c00a0] hover:to-[#d000ff] text-white shadow-xl shadow-purple-900/40 transition-all hover:scale-105">
                  Enter The Arena <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/practice" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base font-semibold border-border bg-secondary/30 hover:bg-secondary/60">
                  Explore Problems
                </Button>
              </Link>
            </div>

            {/* Quick Feature Tickers */}
            <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-xs font-mono text-muted-foreground">
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card/40 border border-border/50">
                <Zap className="h-4 w-4 text-accent" />
                <span>Instant Sandbox Runner</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card/40 border border-border/50">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>Daily Streaks & Badges</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card/40 border border-border/50">
                <Swords className="h-4 w-4 text-purple-400" />
                <span>Live 1v1 WebSocket Duels</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-card/40 border border-border/50">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <span>Hidden Server Test Cases</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-20 md:py-32 bg-[#151518]">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight">
                Designed for Competitive Coders
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                Everything you need to advance from novice to master algorithmic engineer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((f) => (
                <Card key={f.title} className="bg-[#1c1c20] border-border/70 hover:border-accent/80 transition-all hover:shadow-lg hover:shadow-purple-950/20 group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="h-12 w-12 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#25252a] text-purple-300">
                      {f.badge}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <CardTitle className="text-xl font-bold font-headline text-white group-hover:text-accent transition-colors">
                      {f.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 py-8 bg-[#101012]">
          <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Logo className="h-5 w-5 text-accent" />
              <span className="font-bold text-foreground">CodeClash Arena</span>
              <span>• Full-Stack Competitive DSA Platform</span>
            </div>
            <p>&copy; {new Date().getFullYear()} CodeClash. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
