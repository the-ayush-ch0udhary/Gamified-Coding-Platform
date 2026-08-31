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
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-6xl">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-mono text-purple-300">
          <BotMessageSquare className="h-3.5 w-3.5 text-accent" />
          <span>Server-Side Algorithmic AI Coach</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
          AI Code Explainer
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Get staff-engineer-grade line-by-line breakdowns, asymptotic time & space complexity, pattern detection, and optimization recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        {/* Left Column: Monaco Code Editor Input */}
        <div className="flex flex-col space-y-4">
          <div className="flex-1 rounded-xl border border-border overflow-hidden flex flex-col">
            <MonacoCodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onReset={() => setCode(DEFAULT_SNIPPET)}
            />
          </div>

          <Button
            size="lg"
            onClick={handleExplainCode}
            disabled={loading}
            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-purple-600 to-[#BF00FF] hover:from-purple-700 text-white shadow-lg shadow-purple-900/30"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Algorithm & Complexity...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Explain Code & Analyze Complexity
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: AI Explanation Output */}
        <Card className="bg-[#18181b]/80 border-border/80 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 bg-[#151518] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Algorithmic Breakdown
              </CardTitle>
            </div>

            {explanation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-5 flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground font-mono text-xs">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <span>Generating line-by-line explanation and Big-O analysis...</span>
              </div>
            ) : explanation ? (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground/90">
                {explanation}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-3 text-muted-foreground font-mono text-xs">
                <BotMessageSquare className="h-10 w-10 text-accent opacity-50 mx-auto" />
                <p>Paste or write code in the editor on the left and click "Explain Code".</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
