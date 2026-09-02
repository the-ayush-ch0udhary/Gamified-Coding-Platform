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
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-mono text-xs">Loading Profile...</p>
      </div>
    );
  }

  const levelInfo = profile?.level_info;
  const masteryConcepts = profile?.mastery_info?.concepts || [];

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-border p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
          <Avatar className="h-20 w-20 border-2 border-primary/20 ring-4 ring-primary/5 shadow-xs">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {profile?.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5 flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">{profile?.username}</h1>
              <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                Level {levelInfo?.level || 1}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{profile?.email}</p>

            {/* XP Progress Bar */}
            <div className="w-full max-w-md pt-1">
              <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                <span>XP Progress</span>
                <span>{levelInfo?.xp_in_level || 0} / {levelInfo?.xp_needed_for_level || 100} XP ({levelInfo?.progress_percentage || 0}%)</span>
              </div>
              <Progress value={levelInfo?.progress_percentage || 0} className="h-1.5 bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto text-center font-mono">
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-[10px] uppercase text-muted-foreground">Rating</span>
              <p className="text-xl font-bold text-primary font-headline">{profile?.rating || 1000}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-[10px] uppercase text-muted-foreground">Streak</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 font-headline">🔥 {profile?.streak || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-[10px] uppercase text-muted-foreground">Coins</span>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 font-headline">🪙 {profile?.coins || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Badges, Settings, Mastery */}
      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList className="bg-muted/60 border border-border h-9">
          <TabsTrigger value="badges" className="text-xs">Achievements & Badges ({badges.length})</TabsTrigger>
          <TabsTrigger value="mastery" className="text-xs">Concept Mastery</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Account Settings</TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {badges.map((b) => (
              <Card key={b.id || b.name} className={`bg-card border-border shadow-xs ${!b.is_unlocked ? "opacity-60" : ""}`}>
                <CardContent className="p-4 flex items-start gap-3.5">
                  <div className={`h-11 w-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border ${
                    b.is_unlocked ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
                  }`}>
                    {b.icon || "🏆"}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-xs text-foreground truncate">{b.name}</h4>
                      {b.is_unlocked ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-mono py-0">
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-mono py-0">
                          <Lock className="h-2 w-2 mr-0.5" /> Locked
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{b.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Mastery Tab */}
        <TabsContent value="mastery" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {masteryConcepts.map((c: any) => (
              <Card key={c.concept_id} className="bg-card border-border shadow-xs">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{c.name}</span>
                    <span className="text-xs font-mono font-bold text-primary">{c.mastery_percentage}%</span>
                  </div>
                  <Progress value={c.mastery_percentage} className="h-1.5 bg-muted" />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {c.solved_problems} / {c.total_problems} Solved (Level {c.current_level})
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-card border-border shadow-xs max-w-2xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold font-headline text-foreground">Profile & API Configuration</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Configure your custom Gemini API key for unlimited AI explanations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-background border-border text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Custom Gemini API Key (Optional)</Label>
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="bg-background border-border text-xs h-9 font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  If provided, your personal key will be used for AI code explanations.
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
