"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  Flame, 
  Coins, 
  Swords, 
  Code, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Clock, 
  Target, 
  TrendingUp, 
  ShieldAlert, 
  ChevronRight,
  Sparkles,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthToken, getApiUrl, isAuthenticated } from "@/lib/auth";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>("00:00:00");
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    fetchDashboard();
  }, [router]);

  const fetchDashboard = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data?.daily_challenge) return;
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diff = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setCountdown(`${h}:${m}:${s}`);
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [data]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-mono text-sm">Loading Arena Dashboard...</p>
      </div>
    );
  }

  const user = data?.user;
  const levelInfo = user?.level_info;
  const daily = data?.daily_challenge;
  const concepts = data?.concepts_mastery || [];
  const recommended = data?.recommended_problems || [];
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      {/* Top Banner: Player Identity & Fast Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c1335] via-[#211738] to-[#121214] border border-purple-900/40 p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-accent ring-4 ring-purple-900/50 shadow-lg">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="text-xl font-bold bg-purple-950 text-purple-200">
                {user?.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight text-white">
                  {user?.username}
                </h1>
                <Badge className="bg-gradient-to-r from-purple-600 to-[#BF00FF] text-white border-0 font-mono font-bold text-xs">
                  Level {levelInfo?.level || 1}
                </Badge>
              </div>
              <p className="text-sm text-purple-200/70 font-mono flex items-center gap-2">
                <span>Global Rank: <strong className="text-white font-bold">#{user?.global_rank || 1}</strong></span>
                <span>•</span>
                <span>Elo Rating: <strong className="text-yellow-400 font-bold">{user?.rating || 1000}</strong></span>
              </p>
              {/* XP Progress Bar */}
              <div className="w-64 sm:w-80 pt-1">
                <div className="flex justify-between text-xs font-mono text-purple-300/80 mb-1">
                  <span>Level Progress</span>
                  <span>{levelInfo?.xp_in_level || 0} / {levelInfo?.xp_needed_for_level || 100} XP ({levelInfo?.progress_percentage || 0}%)</span>
                </div>
                <Progress value={levelInfo?.progress_percentage || 0} className="h-2 bg-purple-950/80 border border-purple-800/40" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
            <Link href="/battle">
              <Button size="lg" className="h-12 px-6 bg-gradient-to-r from-[#4B0082] to-[#BF00FF] hover:from-[#5c00a0] hover:to-[#d000ff] text-white font-bold shadow-lg shadow-purple-900/40 transition-all hover:scale-105">
                <Swords className="mr-2 h-5 w-5" />
                Find 1v1 Battle
              </Button>
            </Link>
            <Link href="/practice">
              <Button size="lg" variant="outline" className="h-12 px-5 border-border bg-card/60 hover:bg-card text-foreground font-semibold">
                <Code className="mr-2 h-5 w-5 text-accent" />
                DSA Skill Tree
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <Card className="bg-[#18181b]/80 border-border/80 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Daily Streak</CardTitle>
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-amber-400">
              {user?.streak || 0} <span className="text-sm font-normal text-muted-foreground font-mono">Days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Best: {user?.longest_streak || 0} days</p>
          </CardContent>
        </Card>

        {/* Coins Card */}
        <Card className="bg-[#18181b]/80 border-border/80 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Clash Coins</CardTitle>
            <Coins className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-yellow-300">
              {user?.coins || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">+5 per solve • +20 win</p>
          </CardContent>
        </Card>

        {/* Solved Problems */}
        <Card className="bg-[#18181b]/80 border-border/80 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Problems Solved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-foreground">
              {user?.solved_breakdown?.total || 0}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono mt-1">
              <span className="text-green-400">{user?.solved_breakdown?.easy || 0}E</span>
              <span className="text-yellow-400">{user?.solved_breakdown?.medium || 0}M</span>
              <span className="text-red-400">{user?.solved_breakdown?.hard || 0}H</span>
            </div>
          </CardContent>
        </Card>

        {/* Battle Record */}
        <Card className="bg-[#18181b]/80 border-border/80 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Battle Arena</CardTitle>
            <Trophy className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-purple-300">
              {user?.wins || 0}W - {user?.losses || 0}L
            </div>
            <p className="text-xs text-muted-foreground mt-1">Win Rate: {user?.win_rate || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Center 2-Column: Daily Challenge & Recommended Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Challenge Card (1 col) */}
        <Card className="bg-gradient-to-b from-[#1e1533] to-[#121214] border-purple-800/40 relative overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-950 text-purple-300 border border-purple-700/50 font-mono text-xs">
                  <Sparkles className="mr-1 h-3 w-3 text-accent" />
                  Daily Quest
                </Badge>
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-black/40 px-2 py-0.5 rounded">
                  <Clock className="h-3 w-3 text-accent" />
                  <span>{countdown}</span>
                </div>
              </div>
              <CardTitle className="text-xl font-bold font-headline text-white mt-3">
                {daily?.problem?.title || "Daily DSA Challenge"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Solve today's challenge to keep your streak and earn +{daily?.bonus_xp || 30} bonus XP.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  daily?.problem?.difficulty === "Hard"
                    ? "border-red-500/40 text-red-400 bg-red-950/20"
                    : daily?.problem?.difficulty === "Medium"
                    ? "border-yellow-500/40 text-yellow-400 bg-yellow-950/20"
                    : "border-green-500/40 text-green-400 bg-green-950/20"
                }>
                  {daily?.problem?.difficulty || "Easy"}
                </Badge>
                <Badge variant="secondary" className="bg-[#202024] text-xs font-mono">
                  {daily?.problem?.category || "Arrays"}
                </Badge>
              </div>

              {daily?.is_solved ? (
                <div className="flex items-center gap-2 bg-green-950/30 border border-green-500/30 text-green-300 p-3 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Completed today! Bonus claimed.
                </div>
              ) : null}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            {daily?.problem ? (
              <Link href={`/practice/${daily.problem.id}`}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-[#BF00FF] hover:from-purple-700 hover:to-[#A000D8] text-white font-bold">
                  {daily.is_solved ? "Review Solution" : "Solve Challenge Now"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </div>
        </Card>

        {/* Recommended Problems (2 cols) */}
        <Card className="lg:col-span-2 bg-[#18181b]/80 border-border/80 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-headline">Personalized Training</CardTitle>
                <CardDescription className="text-xs">
                  Targeted problems tailored to reinforce your weak DSA concepts.
                </CardDescription>
              </div>
              <Link href="/practice">
                <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent/80">
                  View All <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {recommended.map((problem: any) => (
                <Link
                  key={problem.id}
                  href={`/practice/${problem.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-[#121214]/60 hover:border-accent hover:bg-[#1a1a20] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-purple-950/40 border border-purple-800/30 flex items-center justify-center font-mono font-bold text-xs text-purple-300">
                      #{problem.level_number || 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                        {problem.title}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {problem.category} • +{problem.xp_reward || 10} XP
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      problem.difficulty === "Hard"
                        ? "border-red-500/40 text-red-400"
                        : problem.difficulty === "Medium"
                        ? "border-yellow-500/40 text-yellow-400"
                        : "border-green-500/40 text-green-400"
                    }>
                      {problem.difficulty}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* DSA Skill Tree & Mastery Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-headline">DSA Roadmap & Concept Mastery</h2>
            <p className="text-xs text-muted-foreground">
              Overall Mastery: <strong className="text-accent font-bold">{data?.overall_dsa_progress || 0}%</strong> across 8 core topics
            </p>
          </div>
          <Link href="/practice">
            <Button size="sm" variant="outline" className="text-xs font-semibold">
              Explore Skill Tree
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {concepts.map((concept: any) => (
            <Card key={concept.concept_id} className="bg-[#18181b]/70 border-border/80 hover:border-accent/60 transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{concept.name}</span>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {concept.mastery_percentage}%
                  </span>
                </div>
                <Progress value={concept.mastery_percentage} className="h-1.5 bg-secondary" />
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Level {concept.current_level} / {concept.total_levels}</span>
                  <span>{concept.solved_problems} solved</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
