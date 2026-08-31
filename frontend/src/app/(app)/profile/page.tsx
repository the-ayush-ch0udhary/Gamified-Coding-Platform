"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Trophy, 
  Flame, 
  Coins, 
  Swords, 
  Target, 
  Award, 
  CheckCircle2, 
  Lock, 
  Save, 
  Loader2,
  Code,
  ShieldCheck,
  Zap,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiUrl, getAuthToken, setAuthData, isAuthenticated } from "@/lib/auth";
import type { User, Badge as BadgeType } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [geminiKey, setGeminiKey] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    fetchProfileData();
  }, [router]);

  const fetchProfileData = async () => {
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, badgesRes, historyRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/profile`, { headers }),
        fetch(`${getApiUrl()}/api/profile/badges`, { headers }),
        fetch(`${getApiUrl()}/api/battle/history`, { headers })
      ]);

      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
        setDisplayName(p.name || p.username || "");
        setGeminiKey(p.gemini_api_key || "");
      }
      if (badgesRes.ok) {
        const b = await badgesRes.json();
        setBadges(b.badges || []);
      }
      if (historyRes.ok) {
        const h = await historyRes.json();
        setBattleHistory(h.battles || []);
      }
    } catch (e) {
      console.error("Failed to load profile data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: displayName,
          gemini_api_key: geminiKey || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => ({ ...prev, ...data.user }));
        setAuthData(token!, data.user);
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-mono text-sm">Loading Competitive Profile...</p>
      </div>
    );
  }

  const levelInfo = profile?.level_info;
  const masteryConcepts = profile?.mastery_info?.concepts || [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-6xl">
      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c1335] via-[#211738] to-[#121214] border border-purple-900/40 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar className="h-24 w-24 border-3 border-accent ring-4 ring-purple-900/40 shadow-xl">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="text-2xl font-bold bg-purple-950 text-purple-200">
              {profile?.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2 flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-bold font-headline text-white">{profile?.username}</h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-[#BF00FF] text-white border-0 font-mono text-xs">
                Level {levelInfo?.level || 1}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>

            {/* XP Progress Bar */}
            <div className="w-full max-w-md pt-2">
              <div className="flex justify-between text-xs font-mono text-purple-300 mb-1">
                <span>XP Progress</span>
                <span>{levelInfo?.xp_in_level || 0} / {levelInfo?.xp_needed_for_level || 100} XP ({levelInfo?.progress_percentage || 0}%)</span>
              </div>
              <Progress value={levelInfo?.progress_percentage || 0} className="h-2 bg-purple-950 border border-purple-800/40" />
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="grid grid-cols-3 gap-3 bg-[#121214]/80 p-4 rounded-xl border border-border/80 text-center font-mono w-full md:w-auto">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Elo Rating</span>
              <p className="text-lg font-bold font-headline text-yellow-400">{profile?.rating || 1000}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Streak</span>
              <p className="text-lg font-bold font-headline text-amber-400">🔥 {profile?.streak || 0}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Coins</span>
              <p className="text-lg font-bold font-headline text-yellow-300">🪙 {profile?.coins || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Tabs */}
      <Tabs defaultValue="mastery" className="space-y-6">
        <TabsList className="bg-[#18181b] border border-border p-1">
          <TabsTrigger value="mastery" className="text-xs">DSA Concept Mastery</TabsTrigger>
          <TabsTrigger value="badges" className="text-xs">Achievements & Badges ({badges.filter(b => b.unlocked).length})</TabsTrigger>
          <TabsTrigger value="battles" className="text-xs">Battle Logs ({battleHistory.length})</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Account Settings</TabsTrigger>
        </TabsList>

        {/* TAB 1: DSA CONCEPT MASTERY */}
        <TabsContent value="mastery" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {masteryConcepts.map((c: any) => (
              <Card key={c.concept_id} className="bg-[#18181b]/80 border-border/80">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold font-headline">{c.name}</CardTitle>
                  <span className="text-xs font-mono font-bold text-accent">{c.mastery_percentage}%</span>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={c.mastery_percentage} className="h-1.5 bg-secondary" />
                  <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Level {c.current_level} / {c.total_levels}</span>
                    <span>{c.solved_problems} solved</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: ACHIEVEMENTS & BADGES */}
        <TabsContent value="badges" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge: any) => (
              <Card
                key={badge.badge_id}
                className={`transition-all p-5 flex flex-col items-center text-center space-y-3 ${
                  badge.unlocked
                    ? "bg-[#1e1533]/80 border-accent/60 shadow-lg shadow-purple-950/20"
                    : "bg-[#151518]/40 border-border/40 opacity-50"
                }`}
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border-2 ${
                  badge.unlocked
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-secondary/40 border-border text-muted-foreground"
                }`}>
                  {badge.unlocked ? <Award className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
                </div>

                {badge.unlocked ? (
                  <Badge className="bg-green-950 text-green-300 border-green-500/30 text-[10px] font-mono">
                    <CheckCircle2 className="mr-1 h-3 w-3 text-green-400" />
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                    Locked
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: BATTLE HISTORY LOGS */}
        <TabsContent value="battles" className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-[#18181b]/80 overflow-hidden">
            {battleHistory.map((b, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${
                    b.result === "win"
                      ? "bg-green-950 text-green-400 border border-green-500/40"
                      : b.result === "draw"
                      ? "bg-yellow-950 text-yellow-400 border border-yellow-500/40"
                      : "bg-red-950 text-red-400 border border-red-500/40"
                  }`}>
                    {b.result}
                  </span>
                  <span className="font-semibold text-foreground text-sm">vs {b.opponent_name || "Opponent"}</span>
                </div>

                <div className="flex items-center gap-6">
                  <span className={b.rating_delta >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {b.rating_delta >= 0 ? `+${b.rating_delta}` : b.rating_delta} Elo
                  </span>
                  <span className="text-muted-foreground">{b.start_time ? new Date(b.start_time).toLocaleDateString() : "Recent"}</span>
                </div>
              </div>
            ))}

            {battleHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-xs font-mono">
                No battles completed yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 4: ACCOUNT SETTINGS */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-[#18181b]/80 border-border/80 max-w-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-headline">Profile Information</CardTitle>
              <CardDescription className="text-xs">Update your display name and optional custom API settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-[#121214] border-border text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Optional Custom Gemini API Key</Label>
                <Input
                  type="password"
                  placeholder="Optional custom key (server key is used by default)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="bg-[#121214] border-border text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  The server already provides built-in AI code explanation. You can optionally supply your personal key.
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-accent hover:bg-accent/90 text-white font-bold text-xs"
              >
                {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
