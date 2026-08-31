"use client";

import React, { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { 
  Play, 
  Send, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Flame, 
  Trophy, 
  Coins, 
  ArrowLeft,
  BotMessageSquare,
  RefreshCw,
  Loader2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MonacoCodeEditor } from "@/components/code-editor/monaco-editor";
import { getApiUrl, getAuthToken, isAuthenticated } from "@/lib/auth";
import type { Problem, ExecutionResult } from "@/lib/types";

const difficultyColors = {
  Easy: "bg-green-500/15 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Hard: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function ProblemSolvingPage({ params }: { params: Promise<{ problemId: string }> }) {
  const [problemId, setProblemId] = useState<string>("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");
  
  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>("testcases");

  // AI Explain state
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Success Celebration Modal
  const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    params.then(({ problemId: pid }) => {
      setProblemId(pid);
      fetchProblem(pid);
    });
  }, [params]);

  const fetchProblem = async (pid: string) => {
    try {
      const token = getAuthToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${getApiUrl()}/api/problems/${pid}`, { headers });
      if (!res.ok) {
        setProblem(null);
        return;
      }
      const data = await res.json();
      setProblem(data);
      
      // Set starter code for default language
      const starter = data.starter_code?.[language] || data.defaultCode || "";
      setCode(starter);
    } catch (e) {
      console.error("Failed to load problem:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (problem) {
      const starter = problem.starter_code?.[newLang] || problem.defaultCode || "";
      setCode(starter);
    }
  };

  const handleResetCode = () => {
    if (problem) {
      const starter = problem.starter_code?.[language] || problem.defaultCode || "";
      setCode(starter);
    }
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
    } catch (e) {
      console.error("Failed to run code:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem || isSubmitting) return;
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    setIsSubmitting(true);
    setActiveTab("output");
    setRunResult(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/api/submissions/submit`, {
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
      setRunResult(data);

      if (data.success) {
        setSubmissionSuccessData(data);
        setSuccessModalOpen(true);
        // Trigger celebratory confetti animation
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    } catch (e) {
      console.error("Failed to submit code:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAI = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setActiveTab("ai");
    setAiExplanation("");

    try {
      const token = getAuthToken();
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${getApiUrl()}/api/explainer/explain`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code_snippet: code,
          language: language,
          problem_id: problem?.id,
        }),
      });

      const data = await res.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (e) {
      setAiExplanation("Unable to generate explanation. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-mono text-sm">Loading Problem Environment...</p>
      </div>
    );
  }

  if (!problem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-4 px-4 max-w-7xl h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href="/practice">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Roadmap</span>
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <h2 className="font-headline font-bold text-base text-foreground flex items-center gap-2">
            {problem.title}
          </h2>
          <Badge variant="outline" className={`text-xs ${difficultyColors[problem.difficulty]}`}>
            {problem.difficulty}
          </Badge>
          {problem.is_solved && (
            <Badge className="bg-green-950 text-green-300 border-green-500/30 text-xs font-mono">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Solved
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAskAI}
            disabled={aiLoading}
            className="h-8 text-xs font-semibold border-purple-500/40 bg-purple-950/20 text-purple-300 hover:bg-purple-900/40 hover:text-white"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-accent" /> : <BotMessageSquare className="h-3.5 w-3.5 mr-1.5 text-accent" />}
            AI Explain
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="h-8 text-xs font-semibold bg-[#25252a] hover:bg-[#303036] text-foreground"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1.5 text-green-400 fill-green-400" />}
            Run
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="h-8 text-xs font-bold bg-gradient-to-r from-purple-600 to-[#BF00FF] hover:from-purple-700 hover:to-[#A000D8] text-white shadow-md shadow-purple-900/20"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main Workspace Split: Left (Description & Tabs) / Right (Monaco & Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Problem Details, Examples, Constraints, & AI Tab */}
        <div className="flex flex-col rounded-lg border border-border/80 bg-[#141416] overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b border-border/60 bg-[#18181b] px-3 py-1.5 flex items-center justify-between">
              <TabsList className="bg-transparent gap-1 p-0 h-auto">
                <TabsTrigger value="description" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-foreground rounded-md px-3 py-1">
                  Description
                </TabsTrigger>
                <TabsTrigger value="testcases" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-foreground rounded-md px-3 py-1">
                  Test Cases ({problem.testCases?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="output" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-foreground rounded-md px-3 py-1">
                  Execution Output
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-[#222226] data-[state=active]:text-purple-300 rounded-md px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1 text-accent" /> AI Guidance
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Description */}
            <TabsContent value="description" className="flex-1 p-5 overflow-y-auto space-y-5 m-0 text-sm">
              <div className="space-y-2">
                <h1 className="text-xl font-bold font-headline text-foreground">{problem.title}</h1>
                <p className="text-foreground/90 whitespace-pre-line leading-relaxed">{problem.description}</p>
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Examples</h3>
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-[#1a1a1e] border border-border/60 font-mono text-xs space-y-1">
                      <p><strong className="text-purple-400">Input:</strong> {ex.input}</p>
                      <p><strong className="text-green-400">Output:</strong> {ex.output}</p>
                      {ex.explanation && (
                        <p className="text-muted-foreground pt-1"><strong className="text-yellow-400">Explanation:</strong> {ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Guided Hints Section */}
              {problem.hints && problem.hints.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Guided Algorithmic Hints
                  </h3>
                  <div className="space-y-2">
                    {problem.hints.map((hint: string, hIdx: number) => (
                      <details key={hIdx} className="group p-3 rounded-lg bg-[#1a1528]/60 border border-purple-900/40 text-xs transition-all cursor-pointer">
                        <summary className="font-semibold text-purple-300 flex items-center justify-between select-none">
                          <span>💡 Reveal Hint #{hIdx + 1}</span>
                          <span className="text-[10px] text-muted-foreground font-mono group-open:hidden">Click to expand</span>
                        </summary>
                        <p className="mt-2 text-foreground/90 font-mono leading-relaxed pl-2 border-l-2 border-accent">
                          {hint}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Test Cases */}
            <TabsContent value="testcases" className="flex-1 p-5 overflow-y-auto space-y-3 m-0 text-sm">
              <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Public Test Cases</h3>
              {problem.testCases?.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#1a1a1e] border border-border/60 font-mono text-xs space-y-1">
                  <span className="text-[11px] font-bold text-accent">Case #{idx + 1}</span>
                  <p><strong className="text-purple-400">Input:</strong> {tc.input}</p>
                  <p><strong className="text-green-400">Expected:</strong> {tc.expectedOutput}</p>
                </div>
              ))}
            </TabsContent>

            {/* Tab 3: Execution Output */}
            <TabsContent value="output" className="flex-1 p-5 overflow-y-auto space-y-4 m-0 text-sm">
              {isRunning || isSubmitting ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground font-mono text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <span>{isSubmitting ? "Running against all public & hidden test cases..." : "Executing public test cases..."}</span>
                </div>
              ) : runResult ? (
                <div className="space-y-4">
                  {/* Status Banner */}
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

                  {/* Individual Test Cases Results */}
                  {runResult.test_results && runResult.test_results.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Test Case Breakdown</h4>
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
                  <p>Click "Run" or "Submit" to see execution benchmarks and test case results.</p>
                </div>
              )}
            </TabsContent>

            {/* Tab 4: AI Explainer */}
            <TabsContent value="ai" className="flex-1 p-5 overflow-y-auto m-0 text-sm">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground font-mono text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <span>Senior AI Engineer analyzing your code & algorithm...</span>
                </div>
              ) : aiExplanation ? (
                <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                  <div className="p-4 rounded-xl bg-[#1c142c] border border-purple-800/30 whitespace-pre-wrap font-mono">
                    {aiExplanation}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground font-mono text-xs space-y-3">
                  <BotMessageSquare className="h-8 w-8 mx-auto text-accent opacity-60" />
                  <p>Need guidance or want to check time/space complexity? Click below!</p>
                  <Button size="sm" onClick={handleAskAI} className="bg-accent text-white font-bold text-xs">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Explain Code Snippet
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Monaco Code Editor */}
        <div className="flex flex-col h-full overflow-hidden">
          <MonacoCodeEditor
            code={code}
            onChange={setCode}
            language={language}
            onLanguageChange={handleLanguageChange}
            onReset={handleResetCode}
          />
        </div>
      </div>

      {/* SUCCESS MODAL / LEVEL UP CELEBRATION */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="bg-[#18181b] border-purple-700/50 text-foreground max-w-md">
          <DialogHeader className="text-center space-y-2">
            <div className="h-16 w-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <DialogTitle className="text-2xl font-bold font-headline text-white">
              Problem Solved!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              All test cases passed successfully. Rewards credited to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-3 text-center">
            <div className="p-3 rounded-lg bg-[#202025] border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">XP Gained</span>
              <p className="text-lg font-bold font-headline text-purple-400">+{submissionSuccessData?.xp_gained || 10}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#202025] border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Coins</span>
              <p className="text-lg font-bold font-headline text-yellow-400">+{submissionSuccessData?.coins_gained || 5}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#202025] border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Streak</span>
              <p className="text-lg font-bold font-headline text-amber-400">🔥 {submissionSuccessData?.streak || 1}</p>
            </div>
          </div>

          {/* Badges Unlocked Alert if any */}
          {submissionSuccessData?.new_badges && submissionSuccessData.new_badges.length > 0 && (
            <div className="p-3 rounded-lg bg-accent/20 border border-accent/40 flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-accent">New Badge Unlocked!</span>
                <p className="text-muted-foreground">{submissionSuccessData.new_badges[0].badge_name}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-between pt-2">
            <Link href="/practice" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-xs">
                Back to Roadmap
              </Button>
            </Link>
            <Link href="/battle" className="w-full sm:w-auto">
              <Button className="w-full text-xs bg-gradient-to-r from-purple-600 to-[#BF00FF] hover:from-purple-700 hover:to-[#A000D8] text-white font-bold">
                1v1 Duel Arena <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
