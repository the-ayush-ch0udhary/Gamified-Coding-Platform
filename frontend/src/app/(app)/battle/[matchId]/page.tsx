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
  Crown
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
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 minutes
  const [activityFeed, setActivityFeed] = useState<Array<{ time: string; text: string; type: "user" | "opponent" | "system" }>>([
    { time: "00:00", text: "Match started! Both players received the problem.", type: "system" }
  ]);

  // Finished Modal
  const [battleFinishedModal, setBattleFinishedModal] = useState<boolean>(false);
  const [finishResult, setFinishResult] = useState<any>(null);

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
    setActivityFeed((prev) => [{ time: timeStr, text, type }, ...prev.slice(0, 15)]);
  };

  const initializeBattle = async (mid: string) => {
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Get current user profile
      const userRes = await fetch(`${getApiUrl()}/api/auth/me`, { headers });
      if (userRes.ok) {
        const u = await userRes.json();
        setCurrentUserId(u.id);
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
      connectBattleWebSocket(mid, token);
    } catch (e) {
      console.error("Failed to initialize battle:", e);
    } finally {
      setLoading(false);
    }
  };

  const connectBattleWebSocket = (mid: string, token: string | null) => {
    if (!token) return;
    const wsUrl = `${getWsUrl()}/ws/battle/${mid}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "player_connected") {
          addFeedEvent("Player entered combat arena.", "system");
          if (data.battle) setBattleState(data.battle);
        } else if (data.type === "player_disconnected") {
          addFeedEvent("Player connection interrupted.", "system");
          if (data.battle) setBattleState(data.battle);
        } else if (data.type === "opponent_progress") {
          const isMe = data.user_id === currentUserId;
          addFeedEvent(
            isMe
              ? `You passed ${data.passed_test_cases}/${data.total_test_cases} test cases (${data.progress_percentage}%)`
              : `Opponent passed ${data.passed_test_cases}/${data.total_test_cases} test cases (${data.progress_percentage}%)`,
            isMe ? "user" : "opponent"
          );

          setBattleState((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            if (updated.players && updated.players[data.user_id]) {
              updated.players[data.user_id].passed_test_cases = data.passed_test_cases;
              updated.players[data.user_id].total_test_cases = data.total_test_cases;
              updated.players[data.user_id].progress_percentage = data.progress_percentage;
            }
            return updated;
          });
        } else if (data.type === "battle_finished") {
          setFinishResult(data);
          setBattleFinishedModal(true);
          const isWinner = data.results && currentUserId && data.results[currentUserId]?.is_winner;
          addFeedEvent(isWinner ? "VICTORY! You solved the problem first!" : "Match concluded!", "system");

          if (isWinner) {
            try {
              import("canvas-confetti").then((m) => {
                m.default({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
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
    if (!problem || isRunning) return;
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
      addFeedEvent(`Tested code: ${data.passed_test_cases}/${data.total_test_cases} public cases passed`, "user");
    } catch (e) {
      console.error("Failed to run code:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem || isSubmitting) return;
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
        if (data.execution.success) {
          addFeedEvent("All arena test cases passed! Submitting final victory claim...", "user");
        }
      }
    } catch (e) {
      console.error("Failed to submit battle solution:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-mono text-sm">Connecting to Synchronized 1v1 Battle Arena...</p>
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
    total_test_cases: 0,
    progress_percentage: 0,
  };
  const opponent = playersList.find((p) => p.user_id !== currentUserId) || {
    user_id: "opponent",
    username: "Opponent",
    rating: 1000,
    connected: true,
    passed_test_cases: 0,
    total_test_cases: 0,
    progress_percentage: 0,
  };

  const myProgress = me.progress_percentage || 0;
  const oppProgress = opponent.progress_percentage || 0;

  return (
    <div className="container mx-auto py-3 px-4 max-w-7xl h-[calc(100vh-4.5rem)] flex flex-col gap-3">
      {/* 1. HIGH-STAKES ESPORTS COMBAT HUD HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#170e2b] via-[#101016] to-[#250d1a] border border-purple-900/50 p-3 shadow-2xl">
        <div className="grid grid-cols-3 items-center gap-2">
          {/* PLAYER 1 (YOU) - Neon Cyan / Purple Theme */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-cyan-400 ring-4 ring-cyan-950 shadow-lg">
                <AvatarImage src={me.avatar} />
                <AvatarFallback className="bg-cyan-950 text-cyan-200 font-bold">
                  {me.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#121216] ${
                me.connected ? "bg-green-400 animate-pulse" : "bg-red-500"
              }`} />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{me.username}</span>
                <Badge className="bg-cyan-950 text-cyan-300 border-cyan-500/40 text-[10px] font-mono py-0">
                  YOU
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="text-yellow-400 font-bold">{me.rating || 1000} Elo</span>
                <span>•</span>
                <span className="text-cyan-400 font-bold">{myProgress}% Solved</span>
              </div>
            </div>
          </div>

          {/* CENTERPIECE: Glowing Digital Timer & VS Badge */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border shadow-inner font-mono ${
                timeLeft < 300
                  ? "bg-red-950/60 border-red-500/60 text-red-400 animate-pulse shadow-red-900/40"
                  : "bg-[#0c0c10] border-purple-800/40 text-white shadow-purple-950/30"
              }`}>
                <Timer className={`h-4 w-4 ${timeLeft < 300 ? "text-red-400 animate-bounce" : "text-accent"}`} />
                <span className="text-lg font-black tracking-widest">{formatTimer(timeLeft)}</span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Live Synchronized Duel
            </span>
          </div>

          {/* PLAYER 2 (OPPONENT) - Neon Crimson / Pink Theme */}
          <div className="flex items-center justify-end gap-3">
            <div className="space-y-0.5 text-right">
              <div className="flex items-center justify-end gap-2">
                <Badge className="bg-pink-950 text-pink-300 border-pink-500/40 text-[10px] font-mono py-0">
                  RIVAL
                </Badge>
                <span className="font-bold text-sm text-white">{opponent.username}</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs font-mono text-muted-foreground">
                <span className="text-pink-400 font-bold">{oppProgress}% Solved</span>
                <span>•</span>
                <span className="text-yellow-400 font-bold">{opponent.rating || 1000} Elo</span>
              </div>
            </div>

            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-pink-500 ring-4 ring-pink-950 shadow-lg">
                <AvatarImage src={opponent.avatar} />
                <AvatarFallback className="bg-pink-950 text-pink-200 font-bold">
                  {opponent.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#121216] ${
                opponent.connected ? "bg-green-400 animate-pulse" : "bg-red-500"
              }`} />
            </div>
          </div>
        </div>

        {/* 2. DUAL PROGRESS RACE BAR (TUG-OF-WAR) */}
        <div className="mt-3 pt-2.5 border-t border-purple-900/40 space-y-1">
          <div className="flex justify-between text-[11px] font-mono font-semibold">
            <span className="text-cyan-400">Your Progress: {myProgress}%</span>
            <span className="text-pink-400">Opponent Progress: {oppProgress}%</span>
          </div>
          <div className="h-2.5 w-full bg-[#121216] rounded-full overflow-hidden flex border border-border/60">
            <div
              style={{ width: `${myProgress}%` }}
              className="bg-gradient-to-r from-cyan-500 to-accent h-full transition-all duration-500 shadow-md shadow-cyan-500/50"
            />
            <div className="flex-1 bg-transparent" />
            <div
              style={{ width: `${oppProgress}%` }}
              className="bg-gradient-to-l from-pink-500 to-purple-600 h-full transition-all duration-500 shadow-md shadow-pink-500/50"
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE SPLIT: Left (Problem Details & Combat Log) / Right (Monaco Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Problem Details, Examples, Combat Feed */}
        <div className="flex flex-col rounded-xl border border-border/80 bg-[#141416] overflow-hidden shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b border-border/60 bg-[#18181b] px-3 py-1.5 flex items-center justify-between">
              <TabsList className="bg-transparent gap-1 p-0 h-auto">
                <TabsTrigger value="description" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-foreground rounded-md px-3 py-1">
                  Problem Spec
                </TabsTrigger>
                <TabsTrigger value="testcases" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-foreground rounded-md px-3 py-1">
                  Test Cases ({problem.testCases?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="output" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-foreground rounded-md px-3 py-1">
                  Execution Output
                </TabsTrigger>
                <TabsTrigger value="feed" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-accent rounded-md px-3 py-1">
                  <Activity className="h-3 w-3 mr-1 text-accent" /> Live Log
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  className="h-7 text-xs font-semibold bg-[#25252a] hover:bg-[#303036]"
                >
                  {isRunning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1 text-green-400 fill-green-400" />}
                  Test Code
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitCode}
                  disabled={isRunning || isSubmitting}
                  className="h-7 text-xs font-bold bg-gradient-to-r from-purple-600 to-[#BF00FF] hover:from-purple-700 text-white shadow-md shadow-purple-900/30"
                >
                  {isSubmitting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                  Submit & Win
                </Button>
              </div>
            </div>

            {/* Description Tab */}
            <TabsContent value="description" className="flex-1 p-5 overflow-y-auto space-y-4 m-0 text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-headline text-foreground">{problem.title}</h1>
                  <Badge variant="outline" className="text-xs">{problem.difficulty}</Badge>
                </div>
                <div className="text-foreground/90 whitespace-pre-line leading-relaxed font-sans text-xs">
                  {problem.description}
                </div>
              </div>

              {problem.examples && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Examples</h3>
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#1a1a1e] border border-border/60 font-mono text-xs space-y-1">
                      <p><strong className="text-purple-400">Input:</strong> {ex.input}</p>
                      <p><strong className="text-green-400">Output:</strong> {ex.output}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Test Cases Tab */}
            <TabsContent value="testcases" className="flex-1 p-5 overflow-y-auto space-y-3 m-0 text-sm">
              <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Public Arena Test Cases</h3>
              {problem.testCases?.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#1a1a1e] border border-border/60 font-mono text-xs space-y-1">
                  <span className="text-[11px] font-bold text-accent">Case #{idx + 1}</span>
                  <p><strong className="text-purple-400">Input:</strong> {tc.input}</p>
                  <p><strong className="text-green-400">Expected:</strong> {tc.expectedOutput}</p>
                </div>
              ))}
            </TabsContent>

            {/* Execution Output Tab */}
            <TabsContent value="output" className="flex-1 p-5 overflow-y-auto space-y-4 m-0 text-sm">
              {isRunning || isSubmitting ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground font-mono text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <span>Evaluating code in sandbox against arena cases...</span>
                </div>
              ) : runResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border flex items-center justify-between ${
                    runResult.success
                      ? "bg-green-950/20 border-green-500/40 text-green-300"
                      : "bg-red-950/20 border-red-500/40 text-red-300"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {runResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <span className="font-bold text-base">{runResult.status || (runResult.success ? "Accepted" : "Wrong Answer")}</span>
                        <p className="text-xs opacity-80">
                          {runResult.passed_test_cases} / {runResult.total_test_cases} test cases passed
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono">
                      <span>Runtime: <strong className="text-white">{runResult.runtime_ms} ms</strong></span>
                    </div>
                  </div>

                  {runResult.test_results && runResult.test_results.length > 0 && (
                    <div className="space-y-2">
                      {runResult.test_results.map((tr) => (
                        <div
                          key={tr.case_number}
                          className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                            tr.passed
                              ? "bg-green-950/10 border-green-500/20 text-foreground"
                              : "bg-red-950/10 border-red-500/20 text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Case #{tr.case_number}</span>
                            <span className={tr.passed ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                              {tr.passed ? "PASSED" : "FAILED"}
                            </span>
                          </div>
                          <p><strong className="text-purple-400">Input:</strong> {tr.input}</p>
                          <p><strong className="text-green-400">Expected:</strong> {tr.expected_output}</p>
                          <p><strong className={tr.passed ? "text-green-400" : "text-red-400"}>Output:</strong> {tr.actual_output || tr.error}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground font-mono text-xs">
                  <p>Click "Test Code" or "Submit & Win" to execute.</p>
                </div>
              )}
            </TabsContent>

            {/* Combat Activity Feed Tab */}
            <TabsContent value="feed" className="flex-1 p-5 overflow-y-auto space-y-2 m-0 text-xs font-mono">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Live Combat Telemetry</h3>
              {activityFeed.map((event, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    event.type === "user"
                      ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-300"
                      : event.type === "opponent"
                      ? "bg-pink-950/20 border-pink-500/30 text-pink-300"
                      : "bg-[#18181c] border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-muted-foreground">
                      {event.time}
                    </span>
                    <span>{event.text}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Monaco Code Editor */}
        <div className="flex flex-col h-full overflow-hidden rounded-xl border border-border/80 shadow-lg">
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
      </div>

      {/* 4. POST-BATTLE RESULT CELEBRATION MODAL */}
      <Dialog open={battleFinishedModal} onOpenChange={setBattleFinishedModal}>
        <DialogContent className="bg-[#18181c] border-purple-700/50 text-foreground max-w-md shadow-2xl">
          {(() => {
            const isWinner = finishResult?.results?.[currentUserId]?.is_winner;
            const isDraw = finishResult?.is_draw;
            const userRes = finishResult?.results?.[currentUserId] || {};

            return (
              <>
                <DialogHeader className="text-center space-y-3">
                  <div className={`h-20 w-20 rounded-full border-3 flex items-center justify-center mx-auto shadow-2xl ${
                    isWinner
                      ? "bg-gradient-to-br from-yellow-500/30 to-purple-600/30 border-yellow-400 text-yellow-400 ring-8 ring-yellow-500/10 animate-bounce"
                      : isDraw
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                      : "bg-red-500/20 border-red-500 text-red-400"
                  }`}>
                    {isWinner ? <Crown className="h-11 w-11" /> : isDraw ? <Clock className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
                  </div>
                  <DialogTitle className={`text-4xl font-black font-headline tracking-tight ${
                    isWinner ? "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent" : "text-white"
                  }`}>
                    {isWinner ? "MATCH VICTORY!" : isDraw ? "DRAW / TIMEOUT" : "DEFEAT"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {isWinner
                      ? "Flawless submission! You solved the problem first and took the win."
                      : isDraw
                      ? "Battle timed out with equal test case results."
                      : "Opponent submitted a successful solution first. Review and queue again!"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-3 py-3 text-center">
                  <div className="p-3 rounded-xl bg-[#121216] border border-border">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Rating Change</span>
                    <p className={`text-xl font-bold font-headline ${userRes.delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {userRes.delta >= 0 ? `+${userRes.delta}` : userRes.delta}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121216] border border-border">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">XP Earned</span>
                    <p className="text-xl font-bold font-headline text-purple-400">+{userRes.xp_gained || 10}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#121216] border border-border">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Coins</span>
                    <p className="text-xl font-bold font-headline text-yellow-400">+{userRes.coins_gained || 5}</p>
                  </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between pt-2">
                  <Link href="/battle" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full text-xs">
                      Return to Lobby
                    </Button>
                  </Link>
                  <Link href="/battle" className="w-full sm:w-auto">
                    <Button className="w-full text-xs bg-gradient-to-r from-purple-600 to-[#BF00FF] hover:from-purple-700 text-white font-bold">
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
