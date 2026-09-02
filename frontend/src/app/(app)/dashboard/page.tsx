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
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-mono text-xs">Loading Dashboard...</p>
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
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      {/* Top Banner: Player Identity & Fast Actions */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-border p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 ring-4 ring-primary/5 shadow-sm flex-shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {user?.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-foreground">
                  {user?.username}
                </h1>
                <Badge className="bg-primary text-primary-foreground font-mono font-bold text-[10px] px-2 py-0.5">
                  Level {levelInfo?.level || 1}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                <span>Global Rank: <strong className="text-foreground font-semibold">#{user?.global_rank || 1}</strong></span>
                <span>•</span>
                <span>Elo: <strong className="text-primary font-semibold">{user?.rating || 1000}</strong></span>
              </p>
              {/* XP Progress Bar */}
              <div className="w-56 sm:w-72 pt-0.5">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1">
                  <span>Level Progress</span>
                  <span>{levelInfo?.xp_in_level || 0} / {levelInfo?.xp_needed_for_level || 100} XP ({levelInfo?.progress_percentage || 0}%)</span>
                </div>
                <Progress value={levelInfo?.progress_percentage || 0} className="h-1.5 bg-muted" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-end">
            <Link href="/battle">
              <Button size="sm" className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all">
                <Swords className="mr-2 h-4 w-4" />
                1v1 Duel Arena
              </Button>
            </Link>
            <Link href="/practice">
              <Button size="sm" variant="outline" className="h-10 px-4 border-border bg-background hover:bg-muted/50 font-semibold text-xs">
                <Code className="mr-2 h-4 w-4 text-muted-foreground" />
                DSA Skill Trees
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Streak Card */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Daily Streak</CardTitle>
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-foreground">
              {user?.streak || 0} <span className="text-xs font-normal text-muted-foreground font-mono">Days</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Best: {user?.longest_streak || 0} days</p>
          </CardContent>
        </Card>

        {/* Coins Card */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Clash Coins</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-foreground">
              {user?.coins || 0}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">+5 solve • +20 win</p>
          </CardContent>
        </Card>

        {/* Solved Problems */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Problems Solved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-foreground">
              {user?.solved_breakdown?.total || 0}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{user?.solved_breakdown?.easy || 0}E</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{user?.solved_breakdown?.medium || 0}M</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">{user?.solved_breakdown?.hard || 0}H</span>
            </div>
          </CardContent>
        </Card>

        {/* Battle Record */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">1v1 Record</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-foreground">
              {user?.wins || 0}W - {user?.losses || 0}L
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Win Rate: {user?.win_rate || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Center 2-Column: Daily Challenge & Recommended Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Daily Challenge Card (1 col) */}
        <Card className="bg-card border-border shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2 p-5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Daily Challenge
                </Badge>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                  <Clock className="h-3 w-3" />
                  <span>{countdown}</span>
                </div>
              </div>
              <CardTitle className="text-base font-bold font-headline text-foreground mt-2">
                {daily?.problem?.title || "Daily Algorithmic Quest"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Maintain your streak and earn +{daily?.bonus_xp || 30} bonus XP.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] font-mono ${
                  daily?.problem?.difficulty === "Hard"
                    ? "border-red-500/30 text-red-500 bg-red-500/10"
                    : daily?.problem?.difficulty === "Medium"
                    ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                    : "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                }`}>
                  {daily?.problem?.difficulty || "Easy"}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {daily?.problem?.category || "Arrays"}
                </Badge>
              </div>

              {daily?.is_solved ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed today! Bonus claimed.
                </div>
              ) : null}
            </CardContent>
          </div>

          <div className="p-5 pt-0">
            {daily?.problem ? (
              <Link href={`/practice/${daily.problem.id}`}>
                <Button className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
                  {daily.is_solved ? "Review Problem" : "Solve Challenge Now"}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : null}
          </div>
        </Card>

        {/* Recommended Problems (2 cols) */}
        <Card className="lg:col-span-2 bg-card border-border shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-headline text-foreground">Recommended Training</CardTitle>
                <CardDescription className="text-xs">
                  Targeted problems tailored to reinforce your DSA skill tree.
                </CardDescription>
              </div>
              <Link href="/practice">
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 h-7 px-2">
                  View Catalog <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="px-5 pb-4 space-y-2">
              {recommended.map((problem: any) => (
                <Link
                  key={problem.id}
                  href={`/practice/${problem.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 hover:border-border/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center font-mono font-bold text-xs text-foreground">
                      #{problem.level_number || 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                        {problem.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {problem.category} • +{problem.xp_reward || 10} XP
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-mono ${
                      problem.difficulty === "Hard"
                        ? "border-red-500/30 text-red-500"
                        : problem.difficulty === "Medium"
                        ? "border-amber-500/30 text-amber-500"
                        : "border-emerald-500/30 text-emerald-500"
                    }`}>
                      {problem.difficulty}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* DSA Skill Tree & Mastery Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-headline text-foreground">DSA Roadmap Mastery</h2>
            <p className="text-xs text-muted-foreground font-mono">
              Overall Progress: <strong className="text-primary font-bold">{data?.overall_dsa_progress || 0}%</strong> across 8 core tracks
            </p>
          </div>
          <Link href="/practice">
            <Button size="sm" variant="outline" className="text-xs h-8">
              Explore Roadmap
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {concepts.map((concept: any) => (
            <Card key={concept.concept_id} className="bg-card border-border shadow-xs hover:border-primary/40 transition-all">
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{concept.name}</span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {concept.mastery_percentage}%
                  </span>
                </div>
                <Progress value={concept.mastery_percentage} className="h-1 bg-muted" />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
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
