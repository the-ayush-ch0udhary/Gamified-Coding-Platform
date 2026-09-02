"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg text-muted-foreground ${className}`}>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg border border-border/60 bg-secondary/30 hover:bg-secondary text-foreground hover:text-foreground transition-all ${className}`}
          title="Switch theme"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-purple-400 rotate-0 scale-100 transition-all" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 rotate-0 scale-100 transition-all" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border text-xs min-w-[120px] shadow-lg">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer gap-2 py-1.5">
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto text-[10px] text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer gap-2 py-1.5">
          <Moon className="h-3.5 w-3.5 text-purple-400" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto text-[10px] text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2 py-1.5">
          <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto text-[10px] text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
