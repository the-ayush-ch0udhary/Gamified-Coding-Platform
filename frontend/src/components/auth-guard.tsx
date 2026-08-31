"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getApiUrl, getAuthToken, clearAuthData } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Public routes that don't enforce strict login
      const publicRoutes = ["/", "/login", "/auth/login", "/practice", "/leaderboard", "/explainer"];
      
      const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith("/practice/"));
      const token = getAuthToken();

      if (!token) {
        if (!isPublic) {
          router.push("/auth/login");
          return;
        }
        setIsChecking(false);
        return;
      }

      // Verify token with backend
      try {
        const API_URL = getApiUrl();
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          clearAuthData();
          if (!isPublic) {
            router.push("/auth/login");
            return;
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121214]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
