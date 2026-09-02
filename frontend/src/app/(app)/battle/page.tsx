"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Swords, 
  RotateCw, 
  Trophy, 
  ShieldAlert, 
  Sparkles, 
  Zap, 
  Flame, 
  Clock, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Users,
  CheckCircle2,
  Crown,
  Shield,
  Target,
  Activity,
  Bot
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiUrl, getAuthToken, getWsUrl, isAuthenticated } from "@/lib/auth";
import type { User } from "@/lib/types";

const RANK_TIERS = [
  { name: "Grandmaster", minElo: 1500, color: "text-amber-500 border-amber-500/30 bg-amber-500/10", icon: Crown },
  { name: "Diamond", minElo: 1300, color: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10", icon: Sparkles },
  { name: "Platinum", minElo: 1150, color: "text-purple-500 border-purple-500/30 bg-purple-500/10", icon: Shield },
  { name: "Gold", minElo: 1000, color: "text-yellow-600 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/10", icon: Trophy },
  { name: "Silver", minElo: 850, color: "text-slate-600 dark:text-slate-300 border-slate-400/30 bg-slate-500/10", icon: Target },
  { name: "Bronze", minElo: 0, color: "text-amber-700 dark:text-amber-600 border-amber-700/30 bg-amber-700/10", icon: Target },
];

export default function BattleLobbyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>("all");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [queueTime, setQueueTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [matchedOpponent, setMatchedOpponent] = useState<any>(null);
  const [isBotStarting, setIsBotStarting] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const queueTimerRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    fetchLobbyData();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    };
  }, [router]);

  const fetchLobbyData = async () => {
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, historyRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/auth/me`, { headers }),
        fetch(`${getApiUrl()}/api/battle/history`, { headers })
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u);
      }
      if (historyRes.ok) {
        const h = await historyRes.json();
        setBattleHistory(h.battles || []);
      }
    } catch (e) {
      console.error("Failed to load battle lobby data:", e);
    } finally {
      setLoading(false);
    }
  };

  const startMatchmaking = () => {
    const token = getAuthToken();
    if (!token) return;

    setIsSearching(true);
    setQueueTime(0);
    setMatchedOpponent(null);

    queueTimerRef.current = setInterval(() => {
      setQueueTime((prev) => prev + 1);
    }, 1000);

    const wsUrl = `${getWsUrl()}/ws/matchmaking?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: "join_queue",
        concept: selectedConcept !== "all" ? selectedConcept : null,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "match_found") {
          setMatchedOpponent(data.opponent);
          clearInterval(queueTimerRef.current);

          setTimeout(() => {
            router.push(`/battle/${data.battle_id}`);
          }, 1500);
        }
      } catch (e) {
        console.error("Matchmaking WS parse error:", e);
      }
    };

    ws.onclose = () => {
      setIsSearching(false);
      clearInterval(queueTimerRef.current);
    };

    ws.onerror = (e) => {
      console.error("Matchmaking WS error:", e);
      setIsSearching(false);
      clearInterval(queueTimerRef.current);
    };
  };

  const cancelMatchmaking = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "leave_queue" }));
      wsRef.current.close();
    }
    setIsSearching(false);
    clearInterval(queueTimerRef.current);
  };

  const startInstantBotDuel = async () => {
    if (isBotStarting) return;
    setIsBotStarting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/battle/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          player1: { user_id: user?.id, username: user?.username, rating: user?.rating || 1000, avatar: user?.avatar },
          player2: { 
            user_id: "bot_arena_ai", 
            username: "Nexus_AI_Bot", 
            rating: Math.max(900, (user?.rating || 1000) + 20), 
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=NexusAI" 
          },
          problem_id: selectedConcept === "trees" ? "invert-binary-tree" : selectedConcept === "strings" ? "valid-anagram" : "two-sum"
        })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/battle/${data.battle_id}`);
      }
    } catch (e) {
      console.error("Failed to start bot duel:", e);
      setIsBotStarting(false);
    }
  };

  const currentTier = RANK_TIERS.find(t => (user?.rating || 1000) >= t.minElo) || RANK_TIERS[RANK_TIERS.length - 1];
  const TierIcon = currentTier.icon;

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-mono text-xs">Connecting to 1v1 Arena...</p>
      </div>
    );
  }

  const formatQueueTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      {/* High-Impact Arena Header */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-border p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-mono text-primary">
              <Swords className="h-3.5 w-3.5" />
              <span>Ranked Competitive Arena</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-foreground">
              1v1 Code Duel Arena
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-lg leading-relaxed">
              Real-time synchronized coding duels with server-authoritative Elo ratings. First to solve passes all test cases to win.
            </p>
          </div>

          {/* User Tier & Rating Card */}
          <div className="flex items-center gap-4 bg-muted/30 border border-border p-3.5 rounded-xl shadow-xs">
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TierIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">{currentTier.name}</span>
                <Badge className={`text-[10px] font-mono ${currentTier.color}`}>
                  {user?.rating || 1000} Elo
                </Badge>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                {user?.wins || 0}W - {user?.losses || 0}L ({roundWinRate(user?.wins || 0, user?.losses || 0)}% Win Rate)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: Matchmaking & Mode Select Console */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-sm p-6">
            {!isSearching ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold font-headline text-foreground mb-1">Select Battle Mode</h3>
                  <p className="text-xs text-muted-foreground">Choose between global all-topic ranked matchmaking or focused topic duels.</p>
                </div>

                {/* Mode Select Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div
                    onClick={() => setSelectedConcept("all")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedConcept === "all"
                        ? "bg-primary/5 border-primary ring-1 ring-primary/40 shadow-xs"
                        : "bg-muted/20 border-border hover:bg-muted/40 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Swords className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-foreground">Ranked All-Topics</h4>
                        <p className="text-[11px] text-muted-foreground">DSA catalog cross-topic matchmaking</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedConcept("trees")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedConcept !== "all"
                        ? "bg-primary/5 border-primary ring-1 ring-primary/40 shadow-xs"
                        : "bg-muted/20 border-border hover:bg-muted/40 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-foreground">Targeted Topic Duel</h4>
                        <p className="text-[11px] text-muted-foreground">Focus on a specific DSA concept</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedConcept !== "all" && (
                  <div className="space-y-1.5 pt-1 animate-in fade-in">
                    <label className="text-xs font-mono text-muted-foreground">Select Concept Topic</label>
                    <Select value={selectedConcept} onValueChange={setSelectedConcept}>
                      <SelectTrigger className="bg-background border-border text-xs h-9">
                        <SelectValue placeholder="Choose Topic" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-xs">
                        <SelectItem value="arrays">Arrays & Hashing</SelectItem>
                        <SelectItem value="strings">Strings & Patterns</SelectItem>
                        <SelectItem value="linked-lists">Linked Lists</SelectItem>
                        <SelectItem value="stack-queue">Stack & Queue</SelectItem>
                        <SelectItem value="trees">Binary Trees & BST</SelectItem>
                        <SelectItem value="graphs">Graphs & Traversal</SelectItem>
                        <SelectItem value="dynamic-programming">Dynamic Programming</SelectItem>
                        <SelectItem value="greedy">Greedy Algorithms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Primary Fast Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={startMatchmaking}
                    className="flex-1 h-11 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                  >
                    <Swords className="mr-2 h-4 w-4" />
                    Enter Ranked Matchmaking
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={startInstantBotDuel}
                    disabled={isBotStarting}
                    className="h-11 px-5 text-xs sm:text-sm font-semibold border-border bg-background hover:bg-muted/50"
                  >
                    {isBotStarting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4 text-primary" />
                    )}
                    {isBotStarting ? "Spawning AI Bot..." : "Practice vs Arena AI"}
                  </Button>
                </div>
              </div>
            ) : (
              /* Matchmaking HUD Search State */
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
                {matchedOpponent ? (
                  <div className="space-y-5 animate-in fade-in zoom-in duration-300">
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs px-3.5 py-1">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Opponent Locked In!
                    </Badge>

                    {/* Player VS Card */}
                    <div className="flex items-center justify-center gap-8 sm:gap-12 p-6 rounded-xl bg-muted/30 border border-border shadow-sm">
                      <div className="flex flex-col items-center space-y-1.5">
                        <Avatar className="h-16 w-16 border-2 border-primary ring-4 ring-primary/10 shadow-sm">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback>{user?.username?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-foreground">{user?.username}</span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {user?.rating || 1000} Elo
                        </Badge>
                      </div>

                      <div className="text-2xl font-black font-headline text-primary animate-pulse">
                        VS
                      </div>

                      <div className="flex flex-col items-center space-y-1.5">
                        <Avatar className="h-16 w-16 border-2 border-primary ring-4 ring-primary/10 shadow-sm">
                          <AvatarImage src={matchedOpponent?.avatar} />
                          <AvatarFallback>{matchedOpponent?.username?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-foreground">{matchedOpponent?.username}</span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {matchedOpponent?.rating || 1000} Elo
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-primary animate-pulse flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Entering Combat Arena...
                    </p>
                  </div>
                ) : (
                  /* Animated Radar Scanner */
                  <div className="space-y-5">
                    <div className="relative flex items-center justify-center h-24 w-24 mx-auto">
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                      <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
                        <Swords className="h-8 w-8 animate-bounce" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold font-headline text-foreground">
                        Searching for Opponent...
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        Rating target (~{user?.rating || 1000} Elo) • Queue Time: <strong className="text-primary font-bold">{formatQueueTime(queueTime)}</strong>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={cancelMatchmaking}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs px-5 h-8"
                    >
                      Cancel Search
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COL: Arena Stats & Recent Match Logs */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between p-5">
              <CardTitle className="text-sm font-bold font-headline flex items-center gap-2 text-foreground">
                <Activity className="h-4 w-4 text-primary" />
                Ranked Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Rating</span>
                  <p className="text-xl font-bold font-headline text-foreground">{user?.rating || 1000}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Win Rate</span>
                  <p className="text-xl font-bold font-headline text-primary">
                    {roundWinRate(user?.wins || 0, user?.losses || 0)}%
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-xs font-mono text-muted-foreground pt-1 border-t border-border">
                <span>Victories: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{user?.wins || 0}</strong></span>
                <span>Defeats: <strong className="text-red-600 dark:text-red-400 font-semibold">{user?.losses || 0}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Match Logs List */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3 p-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold font-headline text-foreground">Recent Match Logs</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchLobbyData}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                title="Refresh logs"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {battleHistory.slice(0, 6).map((b, idx) => (
                <div
                  key={b.battle_id || idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-xs font-mono hover:bg-muted/60 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase flex-shrink-0 ${
                      b.result === "win"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : b.result === "draw"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : b.result === "in_progress"
                        ? "bg-primary/10 text-primary border border-primary/30 animate-pulse"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                    }`}>
                      {b.result === "in_progress" ? "ACTIVE" : b.result}
                    </span>
                    <div className="min-w-0">
                      <div className="text-foreground font-semibold truncate max-w-[130px]">
                        vs {b.opponent_name || "Opponent"}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {b.problem_title || b.problem_id || "Duel"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {b.result === "in_progress" ? (
                      <Link href={`/battle/${b.battle_id}`}>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-primary border-primary/30 hover:bg-primary/10">
                          Resume
                        </Button>
                      </Link>
                    ) : (
                      <span className={`font-semibold ${b.rating_delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {b.rating_delta >= 0 ? `+${b.rating_delta}` : b.rating_delta} Elo
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {battleHistory.length === 0 && (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  No matches completed yet. Enter queue to test your skills!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function roundWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}
