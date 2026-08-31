import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = "Loading...", className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] gap-4", className)}>
      <Loader2 className="h-12 w-12 animate-spin text-accent" />
      <p className="text-lg text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

export function LoadingFullscreen({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-accent" />
        <p className="text-xl text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}
