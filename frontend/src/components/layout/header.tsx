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
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="container flex h-14 sm:h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Left Side: Brand & Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Logo className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base tracking-tight text-foreground">
                CodeClash
              </span>
              <span className="text-[9px] text-muted-foreground font-mono -mt-1 tracking-widest uppercase">
                Competitive DSA
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-medium",
                    isActive
                      ? "bg-secondary text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Gamification Stats, Theme Toggle, & User Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Level & XP Pill */}
              <div className="hidden lg:flex items-center gap-2 bg-muted/50 border border-border/80 rounded-full px-3 py-1 text-xs">
                <span className="font-bold text-primary font-mono text-[11px]">
                  Lv.{levelInfo?.level || 1}
                </span>
                <div className="w-16">
                  <Progress value={levelInfo?.progress_percentage || 0} className="h-1.5 bg-muted" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {levelInfo?.xp_in_level || 0}/{levelInfo?.xp_needed_for_level || 100} XP
                </span>
              </div>

              {/* Streak Pill */}
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold" title="Daily Streak">
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>{user.streak || 0}</span>
              </div>

              {/* Coins Pill */}
              <div className="hidden sm:flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold" title="Coins">
                <Coins className="h-3.5 w-3.5 text-yellow-500" />
                <span>{user.coins || 0}</span>
              </div>

              {/* Quick Battle CTA */}
              <Link href="/battle" className="hidden sm:block">
                <Button size="sm" className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm">
                  <Swords className="h-3.5 w-3.5 mr-1.5" />
                  <span>Battle</span>
                </Button>
              </Link>
            </>
          ) : null}

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Nav / Sign In */}
          <UserNav user={user} onLogout={() => setUser(null)} />

          {/* Mobile Sheet Trigger */}
          <div className="flex md:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-background border-border text-foreground">
                <div className="flex items-center gap-2 mb-8">
                  <Logo className="h-6 w-6 text-primary" />
                  <span className="font-headline font-bold text-lg text-foreground">CodeClash</span>
                </div>
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-secondary text-foreground font-bold"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
