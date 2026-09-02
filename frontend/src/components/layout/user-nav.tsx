"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearAuthData } from "@/lib/auth";
import type { User } from "@/lib/types";
import { User as UserIcon, LogOut, Swords, Trophy, Sparkles, LogIn } from "lucide-react";

interface UserNavProps {
  user: User | null;
  onLogout?: () => void;
}

export function UserNav({ user, onLogout }: UserNavProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearAuthData();
    if (onLogout) onLogout();
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <Link href="/auth/login">
        <Button size="sm" className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <LogIn className="mr-1.5 h-3.5 w-3.5" />
          Sign In
        </Button>
      </Link>
    );
  }

  const initials = (user.username || "U").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-2 ring-primary/20 p-0 hover:ring-primary transition-all">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary font-mono font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground shadow-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-foreground">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border text-[11px] font-mono text-muted-foreground">
              <span>Rating: <strong className="text-primary">{user.rating || 1000}</strong></span>
              <span>•</span>
              <span>XP: <strong className="text-foreground">{user.total_points || 0}</strong></span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Profile & Badges</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/battle">
              <Swords className="mr-2 h-4 w-4 text-primary" />
              <span>1v1 Battle Arena</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/leaderboard">
              <Trophy className="mr-2 h-4 w-4 text-amber-500" />
              <span>Leaderboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
