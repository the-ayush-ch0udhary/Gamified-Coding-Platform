"use client";

import React, { useState } from "react";
import { 
  BotMessageSquare, 
  Sparkles, 
  Send, 
  Loader2, 
  RotateCcw, 
  Code, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonacoCodeEditor } from "@/components/code-editor/monaco-editor";
import { getApiUrl, getAuthToken } from "@/lib/auth";

const DEFAULT_SNIPPET = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`;

export default function ExplainerPage() {
  const [code, setCode] = useState<string>(DEFAULT_SNIPPET);
  const [language, setLanguage] = useState<string>("python");
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleExplainCode = async () => {
    if (!code || code.trim().length < 5) {
      setError("Please paste or write a valid code snippet.");
      return;
    }

    setLoading(true);
    setError("");
    setExplanation("");

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
        }),
      });

      const data = await res.json();
      if (res.ok && data.explanation) {
        setExplanation(data.explanation);
      } else {
        setError(data.detail || "Failed to analyze code. Please try again.");
      }
    } catch (e: any) {
      setError(e.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-mono text-primary">
          <BotMessageSquare className="h-3.5 w-3.5" />
          <span>Algorithmic Code Coach</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground">
          AI Code Explainer
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto">
          Get line-by-line breakdowns, asymptotic time & space complexity, pattern detection, and optimization recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[500px]">
        {/* Left Column: Monaco Code Editor Input */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Source Code Snippet</span>
            <Button
              size="sm"
              onClick={handleExplainCode}
              disabled={loading}
              className="h-8 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              Analyze Code
            </Button>
          </div>

          <div className="flex-1 min-h-[420px] rounded-lg border border-border overflow-hidden">
            <MonacoCodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onReset={() => setCode(DEFAULT_SNIPPET)}
            />
          </div>
        </div>

        {/* Right Column: AI Analysis Report Output */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Algorithmic Breakdown</span>
            {explanation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>

          <Card className="flex-1 min-h-[420px] bg-card border-border shadow-xs flex flex-col justify-between overflow-hidden">
            <CardContent className="p-4 sm:p-5 flex-1 overflow-y-auto text-xs sm:text-sm leading-relaxed">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-muted-foreground font-mono text-xs">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <span>Parsing AST, calculating complexities, evaluating edge cases...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Analysis Error</p>
                  <p>{error}</p>
                </div>
              ) : explanation ? (
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border whitespace-pre-wrap font-mono">
                    {explanation}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-muted-foreground font-mono text-xs space-y-2 p-6">
                  <BotMessageSquare className="h-8 w-8 text-primary opacity-60" />
                  <p>Paste any algorithm or data structure snippet on the left and click "Analyze Code".</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
