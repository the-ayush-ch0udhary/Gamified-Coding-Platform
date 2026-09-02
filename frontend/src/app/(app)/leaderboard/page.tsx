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
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-0.5 text-xs font-mono text-amber-600 dark:text-amber-400">
          <Trophy className="h-3.5 w-3.5" />
          <span>Ranked Competitive Standings</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground">
          Global Arena Leaderboard
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto">
          Server-authoritative Elo standings from 1v1 Battle Arena and competitive achievements.
        </p>
      </div>

      {/* Controls: Timeframe Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border shadow-xs">
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full sm:w-auto">
          <TabsList className="bg-muted/60 border border-border h-8">
            <TabsTrigger value="global" className="text-xs h-7">All-Time Global</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs h-7">Weekly League</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs h-7">Monthly Season</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search competitor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-background border-border text-xs h-8"
          />
        </div>
      </div>

      {/* Pinned Current User Rank */}
      {currentUserEntry && (
        <div className="p-4 rounded-lg bg-card border border-primary/30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <span className="font-headline font-bold text-xl text-primary">#{currentUserEntry.rank}</span>
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={currentUserEntry.avatar} />
              <AvatarFallback>{currentUserEntry.username.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-foreground">{currentUserEntry.username} (You)</span>
                <Badge variant="secondary" className="text-[10px] font-mono">Lv.{currentUserEntry.level}</Badge>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground">
                {currentUserEntry.wins}W - {currentUserEntry.losses}L ({currentUserEntry.win_rate}% Win Rate)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-bold font-headline text-foreground">{currentUserEntry.rating}</span>
            <p className="text-[9px] text-muted-foreground uppercase font-mono">Elo Rating</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center min-h-[30vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground font-mono text-xs">Fetching ranked standings...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {topThree.map((user, idx) => {
                const rankNum = idx + 1;
                const isFirst = rankNum === 1;

                return (
                  <Card
                    key={user.id}
                    className={`relative overflow-hidden transition-all flex flex-col items-center text-center p-5 bg-card shadow-xs ${
                      isFirst
                        ? "border-amber-500/50 ring-1 ring-amber-500/20 md:-translate-y-1.5"
                        : "border-border"
                    }`}
                  >
                    <div className="absolute top-3 left-3">
                      <span className={`font-headline font-bold text-xs px-2 py-0.5 rounded-full ${
                        rankNum === 1
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : rankNum === 2
                          ? "bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-400/30"
                          : "bg-amber-700/10 text-amber-700 dark:text-amber-600 border border-amber-700/30"
                      }`}>
                        #{rankNum}
                      </span>
                    </div>

                    <Avatar className={`h-16 w-16 mb-2.5 border-2 shadow-xs ${
                      rankNum === 1 ? "border-amber-500 ring-4 ring-amber-500/10" : "border-border"
                    }`}>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                    </Avatar>

                    <h3 className="font-bold text-sm font-headline text-foreground">{user.username}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Level {user.level}</p>

                    <div className="mt-3 pt-3 border-t border-border w-full flex justify-around text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Rating</span>
                        <p className="font-bold text-primary">{user.rating}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Win Rate</span>
                        <p className="font-bold text-foreground">{user.win_rate}%</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">XP</span>
                        <p className="font-bold text-foreground">{user.total_points}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <Card className="bg-card border-border shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40 text-xs">
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-center">Record</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                  <TableHead className="text-right">Elo Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs font-mono">
                {filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-muted-foreground">
                      #{user.rank}
                    </TableCell>
                    <TableCell className="font-sans">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-border">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">Lv.{user.level}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {user.wins}W - {user.losses}L
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{user.win_rate}%</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary font-headline">
                      {user.rating}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
