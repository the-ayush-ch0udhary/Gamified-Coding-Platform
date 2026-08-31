"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/icons";
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
    if (strengthScore <= 1) return { text: "Weak", color: "text-red-400", width: "25%", bg: "bg-red-500" };
    if (strengthScore === 2) return { text: "Fair", color: "text-orange-400", width: "50%", bg: "bg-orange-500" };
    if (strengthScore === 3) return { text: "Good", color: "text-yellow-400", width: "75%", bg: "bg-yellow-500" };
    return { text: "Strong / Unbreakable", color: "text-green-400", width: "100%", bg: "bg-green-500" };
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
          description: "Please fulfill at least 3 password security criteria for your arena account.",
          variant: "destructive",
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords Do Not Match",
          description: "Please make sure your password and confirm password fields match exactly.",
          variant: "destructive",
        });
        return;
      }
      if (!formData.acceptTerms) {
        toast({
          title: "Terms Required",
          description: "Please accept the Competitive Code of Conduct & Terms to enter the arena.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    const API_URL = getApiUrl();
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    const body = isLogin
      ? { email: formData.email.trim().toLowerCase(), password: formData.password }
      : { 
          email: formData.email.trim().toLowerCase(), 
          password: formData.password, 
          username: formData.username.trim() 
        };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      // Store in auth storage
      setAuthData(data.access_token, data.user);

      toast({
        title: isLogin ? "Welcome Back!" : "Account Created Successfully!",
        description: `Welcome to CodeClash, ${data.user?.username}!`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121214] px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_35%,rgba(147,51,234,0.18),rgba(0,0,0,0))]" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#4B0082] to-[#BF00FF] flex items-center justify-center shadow-xl shadow-purple-900/40 border border-purple-500/30 group-hover:scale-105 transition-transform">
              <Logo className="h-6 w-6 text-white" />
            </div>
            <span className="font-headline font-extrabold text-2xl tracking-tight text-white">
              CodeClash
            </span>
          </Link>
          <p className="text-xs text-muted-foreground font-mono">
            {isLogin ? "Sign in to enter the competitive arena" : "Join thousands of competitive developers worldwide"}
          </p>
        </div>

        {/* Main Auth Card */}
        <Card className="bg-[#18181c]/95 border-purple-900/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold font-headline text-white">
                {isLogin ? "Sign In to Arena" : "Create Coder Account"}
              </CardTitle>
              <div className="flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3 text-accent" />
                <span>256-bit Encrypted</span>
              </div>
            </div>
            <CardDescription className="text-xs">
              {isLogin
                ? "Enter your verified credentials to access your profile."
                : "Register with strict credentials to guarantee fair-play rank tracking."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username field (Signup only) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-semibold flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="AlgoChampion"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required={!isLogin}
                    disabled={isLoading}
                    className="bg-[#121214] border-border text-xs h-10 focus-visible:ring-accent"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    3–20 characters (letters, numbers, underscores).
                  </p>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="coder@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="bg-[#121214] border-border text-xs h-10 focus-visible:ring-accent"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  {!isLogin && formData.password && (
                    <span className={`text-[10px] font-mono font-bold ${strength.color}`}>
                      {strength.text}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="bg-[#121214] border-border text-xs h-10 pr-10 focus-visible:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Real-time Strength Meter on Signup */}
                {!isLogin && formData.password && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    {/* Visual Segmented Progress Bar */}
                    <div className="h-1.5 w-full bg-[#121214] rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? (strengthScore === 1 ? "bg-red-500" : strengthScore === 2 ? "bg-orange-500" : strengthScore === 3 ? "bg-yellow-500" : "bg-green-500") : "bg-border/40"}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? (strengthScore === 2 ? "bg-orange-500" : strengthScore === 3 ? "bg-yellow-500" : "bg-green-500") : "bg-border/40"}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? (strengthScore === 3 ? "bg-yellow-500" : "bg-green-500") : "bg-border/40"}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 4 ? "bg-green-500" : "bg-border/40"}`} />
                    </div>

                    {/* Interactive Security Checklist */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1">
                      <span className={`flex items-center gap-1 ${hasMinLength ? "text-green-400" : "text-muted-foreground"}`}>
                        {hasMinLength ? <Check className="h-3 w-3 stroke-[3]" /> : <X className="h-3 w-3" />}
                        8+ Characters
                      </span>
                      <span className={`flex items-center gap-1 ${hasUpperLower ? "text-green-400" : "text-muted-foreground"}`}>
                        {hasUpperLower ? <Check className="h-3 w-3 stroke-[3]" /> : <X className="h-3 w-3" />}
                        Upper & Lower Case
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumber ? "text-green-400" : "text-muted-foreground"}`}>
                        {hasNumber ? <Check className="h-3 w-3 stroke-[3]" /> : <X className="h-3 w-3" />}
                        1+ Number (0-9)
                      </span>
                      <span className={`flex items-center gap-1 ${hasSpecial ? "text-green-400" : "text-muted-foreground"}`}>
                        {hasSpecial ? <Check className="h-3 w-3 stroke-[3]" /> : <X className="h-3 w-3" />}
                        Special Char (!@#$)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field (Signup only) */}
              {!isLogin && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Confirm Password
                    </Label>
                    {formData.confirmPassword && (
                      <span className={`text-[10px] font-mono font-bold ${isMatch ? "text-green-400" : "text-red-400"}`}>
                        {isMatch ? "✓ Passwords Match" : "✕ Do Not Match"}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required={!isLogin}
                      disabled={isLoading}
                      className={`bg-[#121214] text-xs h-10 pr-10 focus-visible:ring-accent ${
                        formData.confirmPassword && (isMatch ? "border-green-500/50" : "border-red-500/50")
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Terms & Anti-Cheat Code of Conduct (Signup only) */}
              {!isLogin && (
                <div className="flex items-start gap-2 pt-1 animate-in fade-in">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-border bg-[#121214] text-accent focus:ring-accent cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-muted-foreground leading-snug cursor-pointer select-none">
                    I agree to the <span className="text-purple-300 font-semibold">Competitive Fair-Play Rules</span> and accept the platform Terms of Service.
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-xs sm:text-sm font-bold bg-gradient-to-r from-[#4B0082] to-[#BF00FF] hover:from-[#5c00a0] hover:to-[#d000ff] text-white shadow-xl shadow-purple-900/40 transition-all hover:scale-[1.01] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating & Initializing Profile...
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In to Arena" : "Complete Registration & Enter Arena"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <div className="mt-6 text-center text-xs text-muted-foreground pt-4 border-t border-border/40">
              {isLogin ? (
                <p>
                  New to CodeClash?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setFormData({ email: "", password: "", confirmPassword: "", username: "", acceptTerms: false });
                    }}
                    className="text-accent hover:underline font-bold ml-1"
                  >
                    Create a free account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setFormData({ email: "", password: "", confirmPassword: "", username: "", acceptTerms: false });
                    }}
                    className="text-accent hover:underline font-bold ml-1"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}