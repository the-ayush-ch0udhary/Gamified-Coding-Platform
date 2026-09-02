"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Shield, 
  Sparkles,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setAuthData, getAuthToken, getApiUrl } from "@/lib/auth";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    acceptTerms: false
  });

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  // Password Strength Calculation
  const hasMinLength = formData.password.length >= 8;
  const hasUpperLower = /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]/.test(formData.password);
  const isMatch = formData.password && formData.password === formData.confirmPassword;

  const strengthScore = [hasMinLength, hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!formData.password) return { text: "Enter Password", color: "text-muted-foreground", width: "0%" };
    if (strengthScore <= 1) return { text: "Weak", color: "text-red-500", width: "25%", bg: "bg-red-500" };
    if (strengthScore === 2) return { text: "Fair", color: "text-amber-500", width: "50%", bg: "bg-amber-500" };
    if (strengthScore === 3) return { text: "Good", color: "text-amber-500", width: "75%", bg: "bg-amber-500" };
    return { text: "Strong", color: "text-emerald-500", width: "100%", bg: "bg-emerald-500" };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      if (!formData.username.trim()) {
        toast({ title: "Validation Error", description: "Username is required.", variant: "destructive" });
        return;
      }
      if (formData.username.length < 3 || formData.username.length > 20) {
        toast({ title: "Validation Error", description: "Username must be 3–20 characters.", variant: "destructive" });
        return;
      }
      if (strengthScore < 3) {
        toast({
          title: "Password Too Weak",
          description: "Please fulfill at least 3 password security criteria.",
          variant: "destructive",
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords Do Not Match",
          description: "Please make sure your password and confirm password fields match.",
          variant: "destructive",
        });
        return;
      }
      if (!formData.acceptTerms) {
        toast({
          title: "Terms Required",
          description: "Please accept the terms and fair play rules to continue.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, username: formData.username };

      const res = await fetch(`${getApiUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: isLogin ? "Login Failed" : "Registration Failed",
          description: data.detail || "Authentication error. Please verify credentials.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setAuthData(data.access_token, data.user);
      toast({
        title: isLogin ? "Welcome back!" : "Account Registered!",
        description: `Logged in as ${data.user.username}.`,
      });

      router.push("/dashboard");
    } catch (e: any) {
      toast({
        title: "Network Error",
        description: "Failed to connect to authentication server.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top Bar for Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center space-x-2.5 mb-4 group">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
            <Logo className="h-5 w-5" />
          </div>
          <span className="font-headline font-bold text-2xl text-foreground">CodeClash</span>
        </Link>
        <h2 className="text-center text-xl font-bold tracking-tight text-foreground">
          {isLogin ? "Sign in to your account" : "Create your competitor profile"}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="p-6 pb-4">
            <div className="flex rounded-lg bg-muted/60 p-1 border border-border">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                  isLogin
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                  !isLogin
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Username / Arena Handle</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. AlgoMaster"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="pl-9 bg-background border-border text-xs h-9"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-9 bg-background border-border text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-9 pr-9 bg-background border-border text-xs h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {!isLogin && formData.password && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex justify-between items-center font-mono text-[11px]">
                      <span className="text-muted-foreground">Strength:</span>
                      <span className={`font-bold ${strength.color}`}>{strength.text}</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${strength.bg || "bg-primary"} transition-all duration-300`} style={{ width: strength.width }} />
                    </div>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="pl-9 pr-9 bg-background border-border text-xs h-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-[11px] text-muted-foreground">
                    I agree to the Fair Play Guidelines and Terms of Service.
                  </label>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs mt-2"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-3.5 w-3.5" />
                )}
                {isLogin ? "Sign In to CodeClash" : "Create Account & Start"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}