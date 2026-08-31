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
        <Button size="sm" variant="default" className="h-8 text-xs font-semibold bg-accent hover:bg-accent/90 text-white">
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
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-accent/30 p-0 hover:ring-accent transition-all">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="bg-purple-900 text-purple-200 font-mono font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#18181b] border-border text-foreground" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/50 text-[11px] font-mono text-purple-400">
              <span>Rating: <strong className="text-white">{user.rating || 1000}</strong></span>
              <span>•</span>
              <span>XP: <strong className="text-white">{user.total_points || 0}</strong></span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4 text-purple-400" />
              <span>Profile & Badges</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/battle">
              <Swords className="mr-2 h-4 w-4 text-accent" />
              <span>1v1 Battle Arena</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/leaderboard">
              <Trophy className="mr-2 h-4 w-4 text-yellow-400" />
              <span>Leaderboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-red-400 hover:text-red-300">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
