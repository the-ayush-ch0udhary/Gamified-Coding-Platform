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
  Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
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
      if (data.execution) {
        setRunResult(data.execution);
        if (data.execution.success) {
          setSubmissionSuccessData(data);
          setSuccessModalOpen(true);
          try {
            import("canvas-confetti").then((m) => {
              m.default({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            });
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Failed to submit code:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAI = async () => {
    if (!problem || aiLoading) return;
    setAiLoading(true);
    setActiveTab("ai");
    setAiExplanation("");

    try {
      const token = getAuthToken();
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${getApiUrl()}/api/ai/explain`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          problem_id: problem.id,
          code: code,
          language: language,
          mode: "breakdown",
        }),
      });

      const data = await res.json();
      setAiExplanation(data.explanation || data.message || "Explanation complete.");
    } catch (e) {
      console.error("Failed to fetch AI explanation:", e);
      setAiExplanation("AI explanation service temporarily offline. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-mono text-xs">Loading Problem Environment...</p>
      </div>
    );
  }

  if (!problem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-3 px-3 sm:px-4 max-w-7xl h-[calc(100vh-4.25rem)] flex flex-col gap-2.5">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/practice">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Roadmap</span>
            </Button>
          </Link>
          <span className="text-muted-foreground text-xs">/</span>
          <h2 className="font-headline font-bold text-sm sm:text-base text-foreground truncate max-w-[220px] sm:max-w-none">
            {problem.title}
          </h2>
          <Badge variant="outline" className={`text-[10px] font-mono ${difficultyColors[problem.difficulty]}`}>
            {problem.difficulty}
          </Badge>
          {problem.is_solved && (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Solved
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAskAI}
            disabled={aiLoading}
            className="h-8 text-xs font-semibold"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-primary" /> : <BotMessageSquare className="h-3.5 w-3.5 mr-1.5 text-primary" />}
            AI Explain
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="h-8 text-xs font-semibold"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-primary" /> : <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-500 fill-emerald-500" />}
            Run
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main Workspace Split: Left (Description & Tabs) / Right (Monaco & Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Problem Details, Examples, Hints, & AI Tab */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b border-border bg-muted/40 px-3 py-1.5 flex items-center justify-between flex-shrink-0">
              <TabsList className="bg-transparent gap-1 p-0 h-auto">
                <TabsTrigger value="description" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-2.5 py-1">
                  Description
                </TabsTrigger>
                <TabsTrigger value="testcases" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-2.5 py-1">
                  Test Cases ({problem.testCases?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="output" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-2.5 py-1">
                  Execution Output
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-background data-[state=active]:text-primary rounded-md px-2.5 py-1">
                  <Sparkles className="h-3 w-3 mr-1 text-primary" /> AI Guidance
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Description */}
            <TabsContent value="description" className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 m-0 text-sm">
              <div className="space-y-1.5">
                <h1 className="text-lg sm:text-xl font-bold font-headline text-foreground">{problem.title}</h1>
                <p className="text-foreground/90 whitespace-pre-line leading-relaxed text-xs sm:text-sm">{problem.description}</p>
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Examples</h3>
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border font-mono text-xs space-y-1">
                      <p><strong className="text-primary">Input:</strong> {ex.input}</p>
                      <p><strong className="text-emerald-600 dark:text-emerald-400">Output:</strong> {ex.output}</p>
                      {ex.explanation && (
                        <p className="text-muted-foreground pt-0.5"><strong>Explanation:</strong> {ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Guided Hints Section */}
              {problem.hints && problem.hints.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Guided Algorithmic Hints
                  </h3>
                  <div className="space-y-2">
                    {problem.hints.map((hint: string, hIdx: number) => (
                      <details key={hIdx} className="group p-2.5 rounded-lg bg-muted/30 border border-border text-xs transition-all cursor-pointer">
                        <summary className="font-semibold text-foreground flex items-center justify-between select-none">
                          <span>💡 Reveal Hint #{hIdx + 1}</span>
                          <span className="text-[10px] text-muted-foreground font-mono group-open:hidden">Click to expand</span>
                        </summary>
                        <p className="mt-2 text-foreground/90 font-mono leading-relaxed pl-2 border-l-2 border-primary">
                          {hint}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Test Cases */}
            <TabsContent value="testcases" className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 m-0 text-sm">
              <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground">Public Test Cases</h3>
              {problem.testCases?.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border font-mono text-xs space-y-1">
                  <span className="text-[11px] font-bold text-primary">Case #{idx + 1}</span>
                  <p><strong className="text-primary">Input:</strong> {tc.input}</p>
                  <p><strong className="text-emerald-600 dark:text-emerald-400">Expected:</strong> {tc.expectedOutput}</p>
                </div>
              ))}
            </TabsContent>

            {/* Tab 3: Execution Output */}
            <TabsContent value="output" className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 m-0 text-sm">
              {isRunning || isSubmitting ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground font-mono text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>{isSubmitting ? "Running against full test suite..." : "Executing public cases..."}</span>
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
                  <Play className="h-7 w-7 mx-auto opacity-40 text-primary" />
                  <p>Click "Run" or "Submit" to test your solution.</p>
                </div>
              )}
            </TabsContent>

            {/* Tab 4: AI Explainer */}
            <TabsContent value="ai" className="flex-1 p-4 sm:p-5 overflow-y-auto m-0 text-sm">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground font-mono text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>AI Engineer analyzing algorithm & edge cases...</span>
                </div>
              ) : aiExplanation ? (
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed">
                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border whitespace-pre-wrap font-mono">
                    {aiExplanation}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground font-mono text-xs space-y-2">
                  <BotMessageSquare className="h-7 w-7 mx-auto text-primary opacity-60" />
                  <p>Need algorithmic intuition or complexity targets? Click AI Explain.</p>
                  <Button size="sm" onClick={handleAskAI} className="bg-primary text-primary-foreground font-bold text-xs h-8">
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

      {/* SUCCESS CELEBRATION MODAL */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-bold font-headline text-foreground">
              Problem Solved!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              All test cases passed. Rewards have been credited to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2.5 py-2 text-center">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">XP Gained</span>
              <p className="text-base font-bold font-headline text-primary">+{submissionSuccessData?.xp_gained || 10}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Coins</span>
              <p className="text-base font-bold font-headline text-amber-600 dark:text-amber-400">+{submissionSuccessData?.coins_gained || 5}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Streak</span>
              <p className="text-base font-bold font-headline text-amber-600 dark:text-amber-400">🔥 {submissionSuccessData?.streak || 1}</p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between pt-2">
            <Link href="/practice" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-xs">
                Back to Roadmap
              </Button>
            </Link>
            <Link href="/battle" className="w-full sm:w-auto">
              <Button className="w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                1v1 Duel Arena <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
