"use client";

import { useState, useEffect } from "react";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Flame, 
  Swords, 
  Search, 
  Loader2,
  TrendingUp,
  User as UserIcon,
  Sparkles
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiUrl, getAuthToken } from "@/lib/auth";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<string>("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLeaderboard(timeframe);
  }, [timeframe]);

  const fetchLeaderboard = async (tf: string) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${getApiUrl()}/api/leaderboard?timeframe=${tf}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setCurrentUserEntry(data.current_user_entry || null);
      }
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leaderboard.filter((entry) =>
    entry.username.toLowerCase().includes(search.toLowerCase())
  );

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-6xl">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-950/30 px-3.5 py-1 text-xs font-mono text-yellow-300">
          <Trophy className="h-3.5 w-3.5 text-yellow-400" />
          <span>Global Competitive Rankings</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
          Arena Leaderboard
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          See who dominates the 1v1 Battle Arena. Ranks are determined by server-authoritative Elo rating and competitive XP.
        </p>
      </div>

      {/* Controls: Timeframe Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#18181b] p-3 rounded-xl border border-border">
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full sm:w-auto">
          <TabsList className="bg-[#121214] border border-border">
            <TabsTrigger value="global" className="text-xs">All-Time Global</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Weekly League</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly Season</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search competitor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#121214] border-border text-xs h-9"
          />
        </div>
      </div>

      {/* Pinned Current User Rank (if logged in) */}
      {currentUserEntry && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#2a1745] via-[#1f1533] to-[#121214] border-2 border-accent shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-headline font-bold text-2xl text-accent">#{currentUserEntry.rank}</span>
            <Avatar className="h-11 w-11 border-2 border-accent">
              <AvatarImage src={currentUserEntry.avatar} />
              <AvatarFallback>{currentUserEntry.username.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{currentUserEntry.username} (You)</span>
                <Badge className="bg-purple-900 text-purple-200 text-[10px] font-mono">Lv.{currentUserEntry.level}</Badge>
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                {currentUserEntry.wins}W - {currentUserEntry.losses}L ({currentUserEntry.win_rate}% Win Rate)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-bold font-headline text-yellow-400">{currentUserEntry.rating}</span>
            <p className="text-[10px] text-muted-foreground uppercase font-mono">Elo Rating</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center min-h-[30vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-3" />
          <p className="text-muted-foreground font-mono text-xs">Fetching ranked standings...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {topThree.map((user, idx) => {
                const rankNum = idx + 1;
                const isFirst = rankNum === 1;
                const isSecond = rankNum === 2;

                return (
                  <Card
                    key={user.id}
                    className={`relative overflow-hidden transition-all flex flex-col items-center text-center p-6 ${
                      isFirst
                        ? "bg-gradient-to-b from-[#2e2008] via-[#1c1626] to-[#121214] border-2 border-yellow-500/60 shadow-xl shadow-yellow-900/20 md:-translate-y-3"
                        : isSecond
                        ? "bg-[#18181b] border-slate-400/40"
                        : "bg-[#18181b] border-amber-700/40"
                    }`}
                  >
                    {isFirst && (
                      <Crown className="absolute top-3 right-3 h-6 w-6 text-yellow-400 animate-bounce" />
                    )}

                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-headline font-bold text-sm mb-3 ${
                      isFirst
                        ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/30"
                        : isSecond
                        ? "bg-slate-300 text-black"
                        : "bg-amber-600 text-white"
                    }`}>
                      #{rankNum}
                    </div>

                    <Avatar className={`h-20 w-20 border-3 mb-3 ${
                      isFirst ? "border-yellow-400 ring-4 ring-yellow-500/20" : isSecond ? "border-slate-300" : "border-amber-600"
                    }`}>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                    </Avatar>

                    <h3 className="font-bold text-base text-white">{user.username}</h3>
                    <Badge className="bg-[#25252a] text-purple-300 border-0 font-mono text-[10px] my-1">
                      Level {user.level}
                    </Badge>

                    <div className="mt-2 text-2xl font-bold font-headline text-yellow-400">
                      {user.rating} <span className="text-xs font-normal text-muted-foreground font-mono">Elo</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground mt-3 pt-3 border-t border-border/40 w-full justify-center">
                      <span>{user.wins}W - {user.losses}L</span>
                      <span>•</span>
                      <span>{user.win_rate}% Win Rate</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Rest of the Leaderboard Table */}
          <div className="rounded-xl border border-border/80 bg-[#18181b]/80 overflow-hidden shadow-md">
            <Table>
              <TableHeader className="bg-[#141418] border-b border-border/60">
                <TableRow>
                  <TableHead className="w-16 font-mono text-xs">Rank</TableHead>
                  <TableHead className="font-mono text-xs">Competitor</TableHead>
                  <TableHead className="font-mono text-xs text-center">Level</TableHead>
                  <TableHead className="font-mono text-xs text-right">Rating</TableHead>
                  <TableHead className="font-mono text-xs text-right">XP</TableHead>
                  <TableHead className="font-mono text-xs text-right">W / L</TableHead>
                  <TableHead className="font-mono text-xs text-right">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow
                    key={user.id}
                    className={`border-b border-border/40 hover:bg-secondary/40 transition-colors ${
                      user.is_current_user ? "bg-purple-950/20 font-bold" : ""
                    }`}
                  >
                    <TableCell className="font-mono font-bold text-sm">
                      #{user.rank}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{user.username}</span>
                          {user.is_current_user && (
                            <Badge className="bg-accent/20 text-accent border-accent/40 text-[10px] font-mono">You</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs text-purple-300">
                      Lv.{user.level}
                    </TableCell>

                    <TableCell className="text-right font-headline font-bold text-yellow-400">
                      {user.rating}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {user.total_points}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs">
                      <span className="text-green-400">{user.wins}</span> / <span className="text-red-400">{user.losses}</span>
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-purple-400">
                      {user.win_rate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
