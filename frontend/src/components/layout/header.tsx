"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Code, 
  Swords, 
  Trophy, 
  BotMessageSquare, 
  Menu, 
  Flame, 
  Coins, 
  Sparkles,
  LayoutDashboard
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/icons";
import { UserNav } from "./user-nav";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getAuthToken, getApiUrl } from "@/lib/auth";
import type { User } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice", label: "DSA Roadmap", icon: Code },
  { href: "/battle", label: "1v1 Battle", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/explainer", label: "AI Explainer", icon: BotMessageSquare },
];

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fetchUserData = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    fetchUserData();
    const interval = setInterval(fetchUserData, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const levelInfo = user?.level_info;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-[#121214]/90 backdrop-blur-md">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Left Side: Brand & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-[#4B0082] to-[#BF00FF] p-0.5 shadow-md shadow-purple-900/30 group-hover:scale-105 transition-transform">
              <Logo className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-lg tracking-tight bg-gradient-to-r from-white via-purple-200 to-[#BF00FF] bg-clip-text text-transparent">
                CodeClash
              </span>
              <span className="text-[10px] text-muted-foreground font-mono -mt-1 tracking-widest uppercase">
                eSports DSA
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-semibold",
                    isActive
                      ? "bg-accent/15 text-accent shadow-sm border border-accent/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Gamification Stats & User Navigation */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Level & XP Pill */}
              <div className="hidden lg:flex items-center gap-2 bg-[#1c1c20] border border-border/80 rounded-full px-3 py-1 text-xs">
                <span className="font-bold text-purple-400 font-mono">
                  Lv.{levelInfo?.level || 1}
                </span>
                <div className="w-16">
                  <Progress value={levelInfo?.progress_percentage || 0} className="h-1.5 bg-secondary" />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {levelInfo?.xp_in_level || 0}/{levelInfo?.xp_needed_for_level || 100} XP
                </span>
              </div>

              {/* Streak Pill */}
              <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 text-amber-400 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold" title="Daily Streak">
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                <span>{user.streak || 0}</span>
              </div>

              {/* Coins Pill */}
              <div className="hidden sm:flex items-center gap-1 bg-yellow-950/40 border border-yellow-500/30 text-yellow-300 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold" title="Coins">
                <Coins className="h-3.5 w-3.5 text-yellow-400" />
                <span>{user.coins || 0}</span>
              </div>

              {/* Quick Battle CTA */}
              <Link href="/battle">
                <Button size="sm" className="hidden sm:flex items-center gap-1.5 h-8 bg-gradient-to-r from-purple-600 to-[#BF00FF] hover:from-purple-700 hover:to-[#A000D8] text-white text-xs font-bold shadow-md shadow-purple-600/20">
                  <Swords className="h-3.5 w-3.5" />
                  <span>Battle</span>
                </Button>
              </Link>
            </>
          ) : null}

          {/* User Nav / Sign In */}
          <UserNav user={user} onLogout={() => setUser(null)} />

          {/* Mobile Sheet Trigger */}
          <div className="flex md:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#121214] border-border text-foreground">
                <div className="flex items-center gap-2 mb-8">
                  <Logo className="h-6 w-6 text-accent" />
                  <span className="font-headline font-bold text-lg">CodeClash</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-accent/20 text-accent font-bold"
                            : "text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
