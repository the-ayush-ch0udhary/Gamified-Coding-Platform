"use client";

import React, { useState, useEffect, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Swords, 
  Timer, 
  Play, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Flame, 
  Trophy, 
  Coins, 
  ArrowLeft,
  Loader2,
  ChevronRight,
  ShieldAlert,
  User as UserIcon,
  Wifi,
  WifiOff,
  Zap,
  Activity,
  Sparkles,
  Bot,
  Crown,
  Terminal,
  Code2,
  Check,
  Flag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MonacoCodeEditor } from "@/components/code-editor/monaco-editor";
import { getApiUrl, getAuthToken, getWsUrl, isAuthenticated } from "@/lib/auth";
import type { Problem, BattleRoomState, ExecutionResult } from "@/lib/types";

export default function BattleRoomPage({ params }: { params: Promise<{ matchId: string }> }) {
  const [matchId, setMatchId] = useState<string>("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [battleState, setBattleState] = useState<BattleRoomState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Editor & Execution
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>("description");

  // Timer & Combat Feed
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [activityFeed, setActivityFeed] = useState<Array<{ time: string; text: string; type: "user" | "opponent" | "system" }>>([
    { time: "00:00", text: "Match started! First to solve passes all test cases to win.", type: "system" }
  ]);

  // Modals
  const [battleFinishedModal, setBattleFinishedModal] = useState<boolean>(false);
  const [finishResult, setFinishResult] = useState<any>(null);
  const [forfeitDialogOpen, setForfeitDialogOpen] = useState<boolean>(false);
  const [isForfeiting, setIsForfeiting] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    params.then(({ matchId: mid }) => {
      setMatchId(mid);
      initializeBattle(mid);
    });

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [params, router]);

  const addFeedEvent = (text: string, type: "user" | "opponent" | "system") => {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setActivityFeed((prev) => [{ time: timeStr, text, type }, ...prev.slice(0, 19)]);
  };

  const initializeBattle = async (mid: string) => {
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Get current user profile
      const userRes = await fetch(`${getApiUrl()}/api/auth/me`, { headers });
      let loggedInUid = "";
      if (userRes.ok) {
        const u = await userRes.json();
        loggedInUid = u.id || u._id || "";
        setCurrentUserId(loggedInUid);
      }

      // Get battle details
      const battleRes = await fetch(`${getApiUrl()}/api/battle/${mid}`, { headers });
      if (!battleRes.ok) {
        notFound();
        return;
      }
      const data = await battleRes.json();
      setBattleState(data.battle);
      setProblem(data.problem);

      if (data.problem) {
        const starter = data.problem.starter_code?.[language] || data.problem.defaultCode || "";
        setCode(starter);
      }

      if (data.battle?.remaining_seconds) {
        setTimeLeft(data.battle.remaining_seconds);
      }

      // Start local countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Connect WebSocket
      connectBattleWebSocket(mid, token, loggedInUid);
    } catch (e) {
      console.error("Failed to initialize battle:", e);
    } finally {
      setLoading(false);
    }
  };

  const connectBattleWebSocket = (mid: string, token: string | null, authUid?: string) => {
    if (!token) return;
    const wsUrl = `${getWsUrl()}/ws/battle/${mid}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "player_connected") {
          addFeedEvent("Player connected to combat arena.", "system");
          if (data.battle) setBattleState(data.battle);
        } else if (data.type === "player_disconnected") {
          addFeedEvent("Player disconnected / forfeited match.", "system");
          if (data.battle) setBattleState(data.battle);
        } else if (data.type === "opponent_progress") {
          const myId = authUid || currentUserId;
          const isMe = data.user_id === myId;
          addFeedEvent(
            isMe
              ? `You passed ${data.passed_test_cases}/${data.total_test_cases} test cases (${data.progress_percentage}%)`
              : `Opponent passed ${data.passed_test_cases}/${data.total_test_cases} test cases (${data.progress_percentage}%)`,
            isMe ? "user" : "opponent"
          );

          setBattleState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: {
                ...prev.players,
                [data.user_id]: {
                  ...(prev.players?.[data.user_id] || {}),
                  user_id: data.user_id,
                  username: prev.players?.[data.user_id]?.username || (isMe ? "You" : "Opponent"),
                  rating: prev.players?.[data.user_id]?.rating || 1000,
                  connected: true,
                  passed_test_cases: data.passed_test_cases,
                  total_test_cases: data.total_test_cases,
                  progress_percentage: data.progress_percentage,
                }
              }
            };
          });
        } else if (data.type === "battle_finished") {
          setFinishResult(data);
          setBattleFinishedModal(true);
          const myId = authUid || currentUserId;
          const isWinner = data.results && myId && data.results[myId]?.is_winner;
          
          if (data.reason === "forfeit") {
            addFeedEvent(isWinner ? "VICTORY! Opponent surrendered or exited the match!" : "DEFEAT! Match forfeited.", "system");
          } else {
            addFeedEvent(isWinner ? "VICTORY! All test cases passed first!" : "Match concluded!", "system");
          }

          if (isWinner) {
            try {
              import("canvas-confetti").then((m) => {
                m.default({ particleCount: 160, spread: 100, origin: { y: 0.5 } });
              });
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error("Battle WS message error:", e);
      }
    };
  };

  const handleRunCode = async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsRunning(true);
    setActiveTab("output");
    setRunResult(null);

    try {
      const res = await fetch(`${getApiUrl()}/api/submissions/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: problem.id,
          language: language,
          code: code,
        }),
      });

      const data = await res.json();
      setRunResult(data);
      const passed = data.passed_test_cases ?? 0;
      const total = data.total_test_cases ?? (problem.testCases?.length || 1);
      const pct = Math.round((passed / Math.max(1, total)) * 100);

      addFeedEvent(`Tested code: ${passed}/${total} test cases passed (${pct}%)`, "user");

      setBattleState((prev) => {
        if (!prev || !currentUserId) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [currentUserId]: {
              ...(prev.players?.[currentUserId] || {}),
              user_id: currentUserId,
              passed_test_cases: passed,
              total_test_cases: total,
              progress_percentage: pct,
              connected: true
            }
          }
        };
      });
    } catch (e) {
      console.error("Failed to run code:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem || isSubmitting || isRunning) return;
    setIsSubmitting(true);
    setActiveTab("output");
    setRunResult(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/battle/${matchId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problem_id: problem.id,
          language: language,
          code: code,
        }),
      });

      const data = await res.json();
      if (data.execution) {
        setRunResult(data.execution);
        const passed = data.execution.passed_test_cases ?? 0;
        const total = data.execution.total_test_cases ?? (problem.testCases?.length || 1);
        const pct = Math.round((passed / Math.max(1, total)) * 100);

        setBattleState((prev) => {
          if (!prev || !currentUserId) return prev;
          return {
            ...prev,
            players: {
              ...prev.players,
              [currentUserId]: {
                ...(prev.players?.[currentUserId] || {}),
                user_id: currentUserId,
                passed_test_cases: passed,
                total_test_cases: total,
                progress_percentage: pct,
                connected: true
              }
            }
          };
        });

        if (data.execution.success) {
          addFeedEvent("All 100% test cases passed! Claiming victory...", "user");
        } else {
          addFeedEvent(`Submission evaluated: ${passed}/${total} test cases passed`, "user");
        }
      }
    } catch (e) {
      console.error("Failed to submit battle solution:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForfeit = async () => {
    setIsForfeiting(true);
    try {
      const token = getAuthToken();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "forfeit" }));
      }
      await fetch(`${getApiUrl()}/api/battle/${matchId}/forfeit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error("Failed to forfeit:", e);
    } finally {
      setIsForfeiting(false);
      setForfeitDialogOpen(false);
      router.push("/battle");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmitCode();
        } else {
          handleRunCode();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [problem, language, code, isRunning, isSubmitting, currentUserId]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-mono text-xs">Connecting to 1v1 Battle Arena...</p>
      </div>
    );
  }

  if (!problem) {
    notFound();
  }

  const playersList = Object.values(battleState?.players || {});
  const me = playersList.find((p) => p.user_id === currentUserId) || {
    user_id: currentUserId,
    username: "You",
    rating: 1000,
    connected: true,
    passed_test_cases: 0,
    total_test_cases: problem.testCases?.length || 4,
    progress_percentage: 0,
  };
  const opponent = playersList.find((p) => p.user_id !== currentUserId) || {
    user_id: "opponent",
    username: "Arena Opponent",
    rating: 1020,
    connected: true,
    passed_test_cases: 0,
    total_test_cases: problem.testCases?.length || 4,
    progress_percentage: 0,
  };

  const myProgress = Math.min(100, Math.max(0, me.progress_percentage || 0));
  const oppProgress = Math.min(100, Math.max(0, opponent.progress_percentage || 0));

  return (
    <div className="container mx-auto py-2 px-3 sm:px-4 max-w-7xl h-[calc(100vh-4rem)] flex flex-col gap-2.5">
      {/* 1. DUEL COMBAT HUD HEADER */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-border p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-12 items-center gap-2">
          {/* PLAYER 1 (YOU) */}
          <div className="col-span-4 flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-primary ring-2 ring-primary/10 shadow-xs">
                <AvatarImage src={me.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {me.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                me.connected ? "bg-emerald-500" : "bg-destructive"
              }`} />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[120px]">{me.username}</span>
                <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-primary/30 text-primary">
                  YOU
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="text-primary font-semibold">{me.rating || 1000} Elo</span>
                <span className="hidden sm:inline">•</span>
                <span className="font-semibold text-foreground hidden sm:inline">{myProgress}% Solved</span>
              </div>
            </div>
          </div>

          {/* CENTER: Digital Timer, Forfeit & VS Badge */}
          <div className="col-span-4 flex flex-col items-center justify-center space-y-1 text-center">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono ${
              timeLeft < 300
                ? "bg-destructive/10 border-destructive text-destructive animate-pulse"
                : "bg-muted/40 border-border text-foreground"
            }`}>
              <Timer className={`h-3.5 w-3.5 ${timeLeft < 300 ? "text-destructive" : "text-primary"}`} />
              <span className="text-base sm:text-lg font-bold tracking-wider">{formatTimer(timeLeft)}</span>
            </div>
            
            <button
              onClick={() => setForfeitDialogOpen(true)}
              className="text-[10px] text-destructive hover:underline font-mono inline-flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
            >
              <Flag className="h-3 w-3" />
              <span>Surrender / Exit</span>
            </button>
          </div>

          {/* PLAYER 2 (OPPONENT) */}
          <div className="col-span-4 flex items-center justify-end gap-2.5 sm:gap-3 text-right">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                  RIVAL
                </Badge>
                <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[120px]">{opponent.username}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="font-semibold text-foreground hidden sm:inline">{oppProgress}% Solved</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-muted-foreground font-semibold">{opponent.rating || 1000} Elo</span>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-amber-500 ring-2 ring-amber-500/10 shadow-xs">
                <AvatarImage src={opponent.avatar} />
                <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-xs">
                  {opponent.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                opponent.connected ? "bg-emerald-500" : "bg-destructive"
              }`} />
            </div>
          </div>
        </div>

        {/* 2. DUAL PROGRESS GAUGES */}
        <div className="mt-2.5 pt-2.5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {/* Your Gauge */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-primary font-semibold flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Your Progress: <strong className="text-foreground">{myProgress}%</strong></span>
              </span>
              <span className="text-muted-foreground text-[10px]">
                {me.passed_test_cases || 0} / {me.total_test_cases || (problem.testCases?.length || 4)} Cases
              </span>
            </div>
            <Progress value={myProgress} className="h-1.5 bg-muted" />
          </div>

          {/* Opponent Gauge */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <Flame className="h-3 w-3" />
                <span>Opponent: <strong className="text-foreground">{oppProgress}%</strong></span>
              </span>
              <span className="text-muted-foreground text-[10px]">
                {opponent.passed_test_cases || 0} / {opponent.total_test_cases || (problem.testCases?.length || 4)} Cases
              </span>
            </div>
            <Progress value={oppProgress} className="h-1.5 bg-muted" />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Problem Details, Examples, Combat Feed */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b border-border bg-muted/40 px-3 py-1.5 flex items-center justify-between flex-shrink-0">
              <TabsList className="bg-transparent gap-1 p-0 h-auto">
                <TabsTrigger value="description" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-2.5 py-1">
                  Problem Spec
                </TabsTrigger>
                <TabsTrigger value="testcases" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-2.5 py-1">
                  Test Cases ({problem.testCases?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="output" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-2.5 py-1">
                  Execution Output
                </TabsTrigger>
                <TabsTrigger value="feed" className="text-xs data-[state=active]:bg-background data-[state=active]:text-primary rounded-md px-2.5 py-1">
                  <Activity className="h-3 w-3 mr-1 text-primary" /> Live Log
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Description Tab */}
            <TabsContent value="description" className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 m-0 text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold font-headline text-foreground">{problem.title}</h1>
                  <Badge variant="outline" className="text-xs font-mono">{problem.difficulty}</Badge>
                </div>
                <div className="text-foreground/90 whitespace-pre-line leading-relaxed text-xs">
                  {problem.description}
                </div>
              </div>

              {problem.examples && problem.examples.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Examples</h3>
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border font-mono text-xs space-y-1">
                      <p><strong className="text-primary">Input:</strong> {ex.input}</p>
                      <p><strong className="text-emerald-600 dark:text-emerald-400">Output:</strong> {ex.output}</p>
                      {ex.explanation && (
                        <p className="text-muted-foreground pt-1"><strong>Explanation:</strong> {ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Test Cases Tab */}
            <TabsContent value="testcases" className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 m-0 text-sm">
              <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Public Arena Test Cases</h3>
              {problem.testCases?.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border font-mono text-xs space-y-1">
                  <span className="text-[11px] font-bold text-primary">Case #{idx + 1}</span>
                  <p><strong className="text-primary">Input:</strong> {tc.input}</p>
                  <p><strong className="text-emerald-600 dark:text-emerald-400">Expected:</strong> {tc.expectedOutput}</p>
                </div>
              ))}
            </TabsContent>

            {/* Execution Output Tab */}
            <TabsContent value="output" className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 m-0 text-sm">
              {isRunning || isSubmitting ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground font-mono text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>{isSubmitting ? "Evaluating against test suite..." : "Executing public cases..."}</span>
                </div>
              ) : runResult ? (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
                    runResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {runResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <span className="font-bold text-sm">{runResult.status || (runResult.success ? "Accepted" : "Wrong Answer")}</span>
                        <p className="text-xs opacity-80">
                          {runResult.passed_test_cases} / {runResult.total_test_cases} test cases passed
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono">
                      <span>Runtime: <strong className="text-foreground">{runResult.runtime_ms} ms</strong></span>
                    </div>
                  </div>

                  {runResult.test_results && runResult.test_results.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Test Case Breakdown</h4>
                      {runResult.test_results.map((tr) => (
                        <div
                          key={tr.case_number}
                          className={`p-3 rounded-lg border text-xs font-mono space-y-1 bg-card ${
                            tr.passed
                              ? "border-emerald-500/30"
                              : "border-destructive/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Case #{tr.case_number}</span>
                            <span className={tr.passed ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-destructive font-bold"}>
                              {tr.passed ? "PASSED" : "FAILED"}
                            </span>
                          </div>
                          <p><strong className="text-primary">Input:</strong> {tr.input}</p>
                          <p><strong className="text-emerald-600 dark:text-emerald-400">Expected:</strong> {tr.expected_output}</p>
                          <p><strong className={tr.passed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>Output:</strong> {tr.actual_output || tr.error}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground font-mono text-xs space-y-1.5">
                  <Terminal className="h-7 w-7 mx-auto opacity-40 text-primary" />
                  <p>Click "Test Code" or "Submit Solution" below to execute.</p>
                  <p className="text-[11px] text-muted-foreground/70"><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl+Enter</kbd> to test quickly.</p>
                </div>
              )}
            </TabsContent>

            {/* Live Feed Tab */}
            <TabsContent value="feed" className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2 m-0 text-xs font-mono">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Live Duel Telemetry</h3>
              {activityFeed.map((event, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border flex items-center justify-between ${
                    event.type === "user"
                      ? "bg-primary/5 border-primary/20 text-primary"
                      : event.type === "opponent"
                      ? "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-muted/30 border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {event.time}
                    </span>
                    <span>{event.text}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Monaco Code Editor + Action Bar */}
        <div className="flex flex-col h-full overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          {/* Monaco Editor Container */}
          <div className="flex-1 overflow-hidden min-h-0">
            <MonacoCodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onReset={() => {
                const starter = problem.starter_code?.[language] || problem.defaultCode || "";
                setCode(starter);
              }}
            />
          </div>

          {/* Action Toolbar */}
          <div className="border-t border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              {isRunning ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-semibold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating cases...
                </span>
              ) : isSubmitting ? (
                <span className="text-primary flex items-center gap-1.5 font-semibold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting solution...
                </span>
              ) : runResult?.success ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <Check className="h-3.5 w-3.5" /> All cases passed
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">Ctrl+Enter</kbd> to Test
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="h-8 px-3.5 text-xs font-semibold"
              >
                {isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-primary" />
                ) : (
                  <Play className="h-3.5 w-3.5 mr-1 text-emerald-500 fill-emerald-500" />
                )}
                Test Code
              </Button>

              <Button
                size="sm"
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="h-8 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                Submit Solution
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FORFEIT CONFIRMATION DIALOG */}
      <Dialog open={forfeitDialogOpen} onOpenChange={setForfeitDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Surrender Match?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Exiting this live 1v1 battle counts as an immediate <strong>Defeat</strong> and will deduct Elo rating from your profile.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-between pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForfeitDialogOpen(false)}
              className="text-xs"
            >
              Continue Duel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleForfeit}
              disabled={isForfeiting}
              className="text-xs font-bold"
            >
              {isForfeiting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Confirm Forfeit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. POST-BATTLE RESULT MODAL */}
      <Dialog open={battleFinishedModal} onOpenChange={setBattleFinishedModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-md shadow-2xl">
          {(() => {
            const isWinner = finishResult?.results?.[currentUserId]?.is_winner;
            const isDraw = finishResult?.is_draw;
            const isForfeit = finishResult?.reason === "forfeit";
            const userRes = finishResult?.results?.[currentUserId] || {};

            return (
              <>
                <DialogHeader className="text-center space-y-2">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                    isWinner
                      ? "bg-amber-500/10 border-2 border-amber-500 text-amber-500"
                      : isDraw
                      ? "bg-muted border-2 border-border text-foreground"
                      : "bg-destructive/10 border-2 border-destructive text-destructive"
                  }`}>
                    {isWinner ? <Crown className="h-8 w-8" /> : isDraw ? <Clock className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                  </div>
                  <DialogTitle className="text-2xl font-bold font-headline tracking-tight text-foreground">
                    {isWinner ? "Match Victory!" : isDraw ? "Draw / Timeout" : "Defeat"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {isForfeit
                      ? isWinner
                        ? "Opponent surrendered or exited the match! Victory awarded."
                        : "You surrendered / exited the match. Defeat recorded."
                      : isWinner
                      ? "Flawless submission! You solved the problem first and took the win."
                      : isDraw
                      ? "Battle timed out with equal test case results."
                      : "Opponent submitted a successful solution first. Review and queue again!"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-2.5 py-2 text-center">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Rating Change</span>
                    <p className={`text-lg font-bold font-headline ${userRes.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {userRes.delta >= 0 ? `+${userRes.delta}` : userRes.delta}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">XP Earned</span>
                    <p className="text-lg font-bold font-headline text-primary">+{userRes.xp_gained || 10}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Coins</span>
                    <p className="text-lg font-bold font-headline text-amber-600 dark:text-amber-400">+{userRes.coins_gained || 5}</p>
                  </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between pt-2">
                  <Link href="/battle" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full text-xs">
                      Return to Lobby
                    </Button>
                  </Link>
                  <Link href="/battle" className="w-full sm:w-auto">
                    <Button className="w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                      Queue Another Match <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
