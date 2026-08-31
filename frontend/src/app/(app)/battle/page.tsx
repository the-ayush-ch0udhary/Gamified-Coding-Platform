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
  { name: "Grandmaster", minElo: 1500, color: "text-amber-400 border-amber-500/40 bg-amber-950/20", icon: Crown },
  { name: "Diamond", minElo: 1300, color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/20", icon: Sparkles },
  { name: "Platinum", minElo: 1150, color: "text-purple-400 border-purple-500/40 bg-purple-950/20", icon: Shield },
  { name: "Gold", minElo: 1000, color: "text-yellow-400 border-yellow-500/40 bg-yellow-950/20", icon: Trophy },
  { name: "Silver", minElo: 850, color: "text-slate-300 border-slate-400/40 bg-slate-900/20", icon: Target },
  { name: "Bronze", minElo: 0, color: "text-amber-700 border-amber-800/40 bg-amber-950/10", icon: Target },
];

export default function BattleLobbyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>("all");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [queueTime, setQueueTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [matchedOpponent, setMatchedOpponent] = useState<any>(null);

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
          }, 2000);
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
    }
  };

  const currentTier = RANK_TIERS.find(t => (user?.rating || 1000) >= t.minElo) || RANK_TIERS[RANK_TIERS.length - 1];
  const TierIcon = currentTier.icon;

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-mono text-sm">Connecting to 1v1 Battle Arena...</p>
      </div>
    );
  }

  const formatQueueTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-6xl">
      {/* High-Impact Arena Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1f1035] via-[#161226] to-[#0d0d12] border border-purple-800/40 p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-950/60 px-3.5 py-1 text-xs font-mono text-purple-300">
              <Swords className="h-3.5 w-3.5 text-accent animate-pulse" />
              <span>Ranked Competitive Duel Arena</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-headline tracking-tight text-white">
              1v1 Battle Arena
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
              Real-time synchronized coding duels with server-authoritative Elo matchmaking (+25 / -15). First to pass all test cases takes the crown.
            </p>
          </div>

          {/* User Tier & Rating Card */}
          <div className="flex items-center gap-4 bg-[#121216]/90 border border-purple-900/50 p-4 rounded-xl shadow-xl backdrop-blur-md">
            <div className="h-14 w-14 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-yellow-400">
              <TierIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">{currentTier.name}</span>
                <Badge className={`text-[10px] font-mono ${currentTier.color}`}>
                  {user?.rating || 1000} Elo
                </Badge>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {user?.wins || 0}W - {user?.losses || 0}L ({roundWinRate(user?.wins || 0, user?.losses || 0)}% Win Rate)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLS: Matchmaking & Mode Select Console */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#18181c]/90 border-purple-900/40 relative overflow-hidden shadow-2xl p-6 sm:p-8">
            {!isSearching ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold font-headline text-white mb-1">Select Battle Mode</h3>
                  <p className="text-xs text-muted-foreground">Choose between global all-topic ranked matches or focused topic battles.</p>
                </div>

                {/* Mode Select Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setSelectedConcept("all")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedConcept === "all"
                        ? "bg-purple-950/60 border-accent ring-2 ring-accent/30 shadow-lg shadow-purple-950/40"
                        : "bg-[#121216]/80 border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                        <Swords className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Ranked All-Topics</h4>
                        <p className="text-xs text-muted-foreground">Any DSA concept across full catalog</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedConcept("trees")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedConcept !== "all"
                        ? "bg-purple-950/60 border-accent ring-2 ring-accent/30 shadow-lg shadow-purple-950/40"
                        : "bg-[#121216]/80 border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-purple-900/30 border border-purple-700/40 flex items-center justify-center text-purple-300">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Targeted Topic Duel</h4>
                        <p className="text-xs text-muted-foreground">Focus on a specific DSA concept</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedConcept !== "all" && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <label className="text-xs font-mono text-muted-foreground">Select Concept Topic</label>
                    <Select value={selectedConcept} onValueChange={setSelectedConcept}>
                      <SelectTrigger className="bg-[#121216] border-border text-xs h-10">
                        <SelectValue placeholder="Choose Topic" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#18181b] border-border text-xs">
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
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <Button
                    size="lg"
                    onClick={startMatchmaking}
                    className="flex-1 h-14 text-sm sm:text-base font-bold bg-gradient-to-r from-[#4B0082] to-[#BF00FF] hover:from-[#5c00a0] hover:to-[#d000ff] text-white shadow-xl shadow-purple-900/40 transition-all hover:scale-[1.01]"
                  >
                    <Swords className="mr-2 h-5 w-5" />
                    Enter 1v1 Ranked Queue
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={startInstantBotDuel}
                    className="h-14 px-6 text-xs sm:text-sm font-semibold border-purple-500/40 bg-purple-950/30 text-purple-200 hover:bg-purple-900/50"
                  >
                    <Bot className="mr-2 h-4 w-4 text-accent" />
                    Practice vs Arena AI
                  </Button>
                </div>
              </div>
            ) : (
              /* High-Tech Matchmaking HUD Search State */
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                {matchedOpponent ? (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                    <Badge className="bg-green-950 text-green-300 border-green-500/40 font-mono text-xs px-4 py-1.5 shadow-lg shadow-green-950/30">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                      Opponent Locked In!
                    </Badge>

                    {/* Dramatic Player VS Card */}
                    <div className="flex items-center justify-center gap-8 sm:gap-12 p-6 rounded-2xl bg-[#121216]/90 border border-purple-900/40 shadow-2xl">
                      <div className="flex flex-col items-center space-y-2">
                        <Avatar className="h-20 w-20 border-3 border-accent ring-4 ring-purple-900/40 shadow-lg">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback>{user?.username?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm text-white">{user?.username}</span>
                        <Badge className="bg-purple-950 text-yellow-400 font-mono font-bold text-xs">
                          {user?.rating || 1000} Elo
                        </Badge>
                      </div>

                      <div className="text-4xl font-black font-headline bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent animate-pulse">
                        VS
                      </div>

                      <div className="flex flex-col items-center space-y-2">
                        <Avatar className="h-20 w-20 border-3 border-pink-500 ring-4 ring-pink-900/40 shadow-lg">
                          <AvatarImage src={matchedOpponent?.avatar} />
                          <AvatarFallback>{matchedOpponent?.username?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm text-white">{matchedOpponent?.username}</span>
                        <Badge className="bg-purple-950 text-yellow-400 font-mono font-bold text-xs">
                          {matchedOpponent?.rating || 1000} Elo
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-purple-300 animate-pulse flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                      Entering Combat Arena in 2 seconds...
                    </p>
                  </div>
                ) : (
                  /* Animated Radar Scanner */
                  <div className="space-y-6">
                    <div className="relative flex items-center justify-center h-28 w-28 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
                      <div className="absolute inset-2 rounded-full border border-purple-500/30 animate-pulse" />
                      <div className="h-24 w-24 rounded-full bg-purple-950/60 border-2 border-accent flex items-center justify-center text-accent shadow-2xl shadow-purple-900/40">
                        <Swords className="h-10 w-10 animate-bounce" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold font-headline text-white">
                        Searching for Worthy Opponent...
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        Proximity rating (~{user?.rating || 1000} Elo) • Queue Time: <strong className="text-accent text-sm">{formatQueueTime(queueTime)}</strong>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={cancelMatchmaking}
                      className="border-red-500/40 text-red-400 hover:bg-red-950/40 text-xs px-6 h-9"
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
          <Card className="bg-[#18181c]/90 border-border/80 shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Performance Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#121216] border border-border/50">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Rating</span>
                  <p className="text-2xl font-black font-headline text-yellow-400">{user?.rating || 1000}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#121216] border border-border/50">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Win Rate</span>
                  <p className="text-2xl font-black font-headline text-accent">
                    {roundWinRate(user?.wins || 0, user?.losses || 0)}%
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-xs font-mono text-muted-foreground pt-2 border-t border-border/40">
                <span>Victories: <strong className="text-green-400 font-bold">{user?.wins || 0}</strong></span>
                <span>Defeats: <strong className="text-red-400 font-bold">{user?.losses || 0}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Duels List */}
          <Card className="bg-[#18181c]/90 border-border/80 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-headline">Recent Match Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {battleHistory.slice(0, 5).map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#121216]/80 border border-border/50 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      b.result === "win"
                        ? "bg-green-950 text-green-400 border border-green-500/30"
                        : b.result === "draw"
                        ? "bg-yellow-950 text-yellow-400 border border-yellow-500/30"
                        : "bg-red-950 text-red-400 border border-red-500/30"
                    }`}>
                      {b.result}
                    </span>
                    <span className="text-foreground font-semibold">vs {b.opponent_name || "Opponent"}</span>
                  </div>

                  <span className={b.rating_delta >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {b.rating_delta >= 0 ? `+${b.rating_delta}` : b.rating_delta} Elo
                  </span>
                </div>
              ))}

              {battleHistory.length === 0 && (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  No matches completed yet. Enter the arena queue to test your skill!
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
