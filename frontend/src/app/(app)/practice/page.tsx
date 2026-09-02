"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Code, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Search, 
  Layers, 
  Filter, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Play, 
  TrendingUp, 
  LayoutGrid, 
  ListFilter, 
  Loader2, 
  ShieldAlert, 
  Flame, 
  Award 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getApiUrl, getAuthToken } from "@/lib/auth";
import type { Problem, RoadmapData, DSAConcept } from "@/lib/types";

const difficultyColors = {
  Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

export default function PracticePage() {
  const [viewMode, setViewMode] = useState<"tree" | "catalog">("tree");
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getAuthToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [roadmapRes, problemsRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/dsa/roadmap`, { headers }),
        fetch(`${getApiUrl()}/api/problems`, { headers })
      ]);

      if (roadmapRes.ok) {
        const rData = await roadmapRes.json();
        setRoadmap(rData);
      }
      if (problemsRes.ok) {
        const pData = await problemsRes.json();
        setProblems(pData.problems || []);
      }
    } catch (e) {
      console.error("Failed to load practice data:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch =
      problem.title.toLowerCase().includes(search.toLowerCase()) ||
      problem.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficulty === "all" || problem.difficulty === difficulty;
    const matchesCategory = category === "all" || problem.category === category || problem.concept_id === category;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "solved" && problem.is_solved) ||
      (statusFilter === "unsolved" && !problem.is_solved);

    return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(problems.map((p) => p.category)));

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-mono text-xs">Loading DSA Skill Trees...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-foreground">
              DSA Roadmap & Skill Trees
            </h1>
            <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
              Overall Mastery: {roadmap?.overall_dsa_progress || 0}%
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Master algorithmic concepts through structured tracks with progressive level unlocks.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-muted/50 border border-border p-1 rounded-lg self-start md:self-auto">
          <Button
            size="sm"
            variant={viewMode === "tree" ? "default" : "ghost"}
            onClick={() => setViewMode("tree")}
            className={viewMode === "tree" ? "bg-primary text-primary-foreground font-semibold h-8 text-xs shadow-xs" : "text-muted-foreground h-8 text-xs"}
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Skill Tree Path
          </Button>
          <Button
            size="sm"
            variant={viewMode === "catalog" ? "default" : "ghost"}
            onClick={() => setViewMode("catalog")}
            className={viewMode === "catalog" ? "bg-primary text-primary-foreground font-semibold h-8 text-xs shadow-xs" : "text-muted-foreground h-8 text-xs"}
          >
            <ListFilter className="mr-1.5 h-3.5 w-3.5" />
            All Problems ({problems.length})
          </Button>
        </div>
      </div>

      {/* VIEW 1: CONCEPT ROADMAP & SKILL TREE */}
      {viewMode === "tree" && (
        <div className="space-y-6">
          {/* Concepts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {roadmap?.concepts.map((concept) => (
              <Card key={concept.concept_id} className="bg-card border-border flex flex-col justify-between overflow-hidden shadow-xs">
                <div>
                  <CardHeader className="pb-3 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <Code className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold font-headline text-foreground">{concept.name}</CardTitle>
                          <CardDescription className="text-[11px] font-mono">
                            {concept.solved_problems} / {concept.total_problems} problems solved
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-headline text-primary">{concept.mastery_percentage}%</span>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">Mastery</p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Progressive Level Cards & Connected Path */}
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                      {concept.levels?.map((lvl) => {
                        const isCompleted = lvl.status === "completed";
                        const isCurrent = lvl.status === "current";
                        const isLocked = lvl.status === "locked";

                        return (
                          <div key={lvl.level_number} className="relative">
                            {/* Node Dot */}
                            <div className={`absolute -left-6 top-3 h-5 w-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2 ${
                              isCompleted
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                : isCurrent
                                ? "bg-primary/10 border-primary text-primary animate-pulse ring-2 ring-primary/20"
                                : "bg-muted border-border text-muted-foreground"
                            }`}>
                              {isCompleted ? (
                                <Check className="h-3 w-3 stroke-[3]" />
                              ) : isCurrent ? (
                                <Play className="h-2 w-2 fill-primary" />
                              ) : (
                                <Lock className="h-2 w-2" />
                              )}
                            </div>

                            <div
                              className={`p-3 rounded-lg border transition-all ${
                                isCompleted
                                  ? "bg-emerald-500/5 border-emerald-500/20"
                                  : isCurrent
                                  ? "bg-primary/5 border-primary/40 shadow-xs"
                                  : "bg-muted/20 border-border/40 opacity-60"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-foreground">{lvl.name}</span>
                                  {isCompleted && (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-mono py-0">
                                      Cleared
                                    </Badge>
                                  )}
                                  {isCurrent && (
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-mono py-0">
                                      Current
                                    </Badge>
                                  )}
                                  {isLocked && (
                                    <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground py-0">
                                      Locked
                                    </Badge>
                                  )}
                                </div>

                                <span className="text-[11px] font-mono text-muted-foreground">
                                  {lvl.solved_problems} / {lvl.total_problems} ({lvl.progress_percentage}%)
                                </span>
                              </div>

                              <Progress value={lvl.progress_percentage} className="h-1 bg-muted" />

                              {/* Level Problems List */}
                              {lvl.problem_ids && !isLocked && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                                  {lvl.problem_ids.map((pid) => {
                                    const pObj = problems.find((p) => p.id === pid);
                                    if (!pObj) return null;
                                    return (
                                      <Link key={pid} href={`/practice/${pid}`}>
                                        <Badge
                                          variant="outline"
                                          className={`cursor-pointer text-[11px] font-mono py-0.5 px-2 transition-all ${
                                            pObj.is_solved
                                              ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                                              : "border-border hover:border-primary hover:text-primary"
                                          }`}
                                        >
                                          {pObj.is_solved && <Check className="mr-1 h-3 w-3 text-emerald-500" />}
                                          {pObj.title}
                                        </Badge>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: FILTERABLE PROBLEM CATALOG */}
      {viewMode === "catalog" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-card p-3.5 rounded-lg border border-border shadow-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search problem title..."
                className="pl-8 bg-background border-border text-xs h-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-background border-border text-xs h-8">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background border-border text-xs h-8">
                <SelectValue placeholder="Concept / Topic" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="all">All Concepts</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background border-border text-xs h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unsolved">Unsolved Only</SelectItem>
                <SelectItem value="solved">Solved Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Problems List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredProblems.map((problem) => (
              <Card key={problem.id} className="bg-card border-border hover:border-primary/40 transition-all flex flex-col justify-between group shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-bold font-headline text-foreground group-hover:text-primary transition-colors">
                      {problem.title}
                    </CardTitle>
                    {problem.is_solved && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1 text-muted-foreground">
                    {problem.description.split('\n')[0].replace(/#/g, '')}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={difficultyColors[problem.difficulty]}>
                        {problem.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {problem.category}
                      </Badge>
                    </div>
                    <span className="text-primary font-semibold">+{problem.xp_reward || 10} XP</span>
                  </div>

                  <Link href={`/practice/${problem.id}`} className="block">
                    <Button variant="outline" className="w-full h-8 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      {problem.is_solved ? "Solve Again" : "Solve Problem"}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProblems.length === 0 && (
            <div className="text-center py-12 bg-muted/20 rounded-lg border border-border text-muted-foreground text-xs">
              <p>No problems found matching your selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
