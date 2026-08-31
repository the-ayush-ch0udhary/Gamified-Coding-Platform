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
  Easy: "bg-green-500/15 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Hard: "bg-red-500/15 text-red-400 border-red-500/30",
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
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-mono text-sm">Building DSA Skill Trees...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-headline tracking-tight">DSA Skill Trees & Roadmap</h1>
            <Badge className="bg-purple-950 text-purple-300 border-purple-800/40 text-xs font-mono">
              Overall Mastery: {roadmap?.overall_dsa_progress || 0}%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Master algorithmic concepts through structured, progressive levels with independent unlock criteria.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-[#18181b] border border-border p-1 rounded-lg self-start md:self-auto">
          <Button
            size="sm"
            variant={viewMode === "tree" ? "default" : "ghost"}
            onClick={() => setViewMode("tree")}
            className={viewMode === "tree" ? "bg-accent text-white font-semibold" : "text-muted-foreground"}
          >
            <Layers className="mr-1.5 h-4 w-4" />
            Skill Tree Path
          </Button>
          <Button
            size="sm"
            variant={viewMode === "catalog" ? "default" : "ghost"}
            onClick={() => setViewMode("catalog")}
            className={viewMode === "catalog" ? "bg-accent text-white font-semibold" : "text-muted-foreground"}
          >
            <ListFilter className="mr-1.5 h-4 w-4" />
            All Problems ({problems.length})
          </Button>
        </div>
      </div>

      {/* VIEW 1: CONCEPT ROADMAP & SKILL TREE */}
      {viewMode === "tree" && (
        <div className="space-y-8">
          {/* Recommended Concept Spotlight */}
          {roadmap?.next_recommended_concept && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#1c1335] to-[#121214] border border-purple-800/30">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-300">Recommended Next Focus</span>
                  <p className="text-sm font-bold text-white">
                    Unlock higher levels in <strong className="text-accent">{roadmap.next_recommended_concept}</strong> to level up your profile!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Concepts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roadmap?.concepts.map((concept) => (
              <Card key={concept.concept_id} className="bg-[#18181b]/90 border-border/80 flex flex-col justify-between overflow-hidden shadow-lg">
                <div>
                  <CardHeader className="pb-3 border-b border-border/40 bg-[#151518]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-950 to-purple-900/60 border border-purple-700/40 flex items-center justify-center text-accent shadow-md shadow-purple-950/40">
                          <Code className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold font-headline">{concept.name}</CardTitle>
                          <CardDescription className="text-xs font-mono">
                            {concept.solved_problems} / {concept.total_problems} problems solved
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-headline text-accent">{concept.mastery_percentage}%</span>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Mastery</p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Progressive Level Cards & Connected Path */}
                  <CardContent className="p-5 space-y-4">
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-accent before:via-purple-800/40 before:to-border/30">
                      {concept.levels?.map((lvl) => {
                        const isCompleted = lvl.status === "completed";
                        const isCurrent = lvl.status === "current";
                        const isLocked = lvl.status === "locked";

                        return (
                          <div key={lvl.level_number} className="relative">
                            {/* Connected Node Dot */}
                            <div className={`absolute -left-6 top-3.5 h-5 w-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2 ${
                              isCompleted
                                ? "bg-green-950 border-green-500 text-green-400"
                                : isCurrent
                                ? "bg-purple-950 border-accent text-accent animate-pulse ring-4 ring-purple-900/40"
                                : "bg-[#18181b] border-border text-muted-foreground"
                            }`}>
                              {isCompleted ? (
                                <Check className="h-3 w-3 stroke-[3]" />
                              ) : isCurrent ? (
                                <Play className="h-2.5 w-2.5 fill-accent" />
                              ) : (
                                <Lock className="h-2.5 w-2.5" />
                              )}
                            </div>

                            <div
                              className={`p-3.5 rounded-xl border transition-all ${
                                isCompleted
                                  ? "bg-green-950/10 border-green-500/30 hover:border-green-500/50"
                                  : isCurrent
                                  ? "bg-purple-950/20 border-accent/70 shadow-md shadow-purple-950/30"
                                  : "bg-[#121214]/50 border-border/40 opacity-60"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">{lvl.name}</span>
                                    {isCompleted && (
                                      <Badge className="bg-green-950 text-green-300 border-green-500/30 text-[10px] font-mono py-0">
                                        Cleared
                                      </Badge>
                                    )}
                                    {isCurrent && (
                                      <Badge className="bg-purple-950 text-purple-300 border-accent text-[10px] font-mono py-0 animate-pulse">
                                        Current Target
                                      </Badge>
                                    )}
                                    {isLocked && (
                                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border py-0">
                                        Locked
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <span className="text-xs font-mono text-muted-foreground">
                                  {lvl.solved_problems} / {lvl.total_problems} ({lvl.progress_percentage}%)
                                </span>
                              </div>

                              <Progress value={lvl.progress_percentage} className="h-1.5 bg-secondary" />

                              {/* Level Problems Link List */}
                              {lvl.problem_ids && !isLocked && (
                                <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-border/30">
                                  {lvl.problem_ids.map((pid) => {
                                    const pObj = problems.find((p) => p.id === pid);
                                    if (!pObj) return null;
                                    return (
                                      <Link key={pid} href={`/practice/${pid}`}>
                                        <Badge
                                          variant="outline"
                                          className={`cursor-pointer hover:border-accent text-xs font-mono py-1 px-2.5 transition-all ${
                                            pObj.is_solved
                                              ? "border-green-500/40 text-green-300 bg-green-950/30"
                                              : "border-border/60 hover:bg-[#202024] hover:text-accent"
                                          }`}
                                        >
                                          {pObj.is_solved && <Check className="mr-1 h-3 w-3 text-green-400" />}
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
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#18181b] p-4 rounded-xl border border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problem title..."
                className="pl-9 bg-[#121214] border-border text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-[#121214] border-border text-xs">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-border text-xs">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-[#121214] border-border text-xs">
                <SelectValue placeholder="Concept / Topic" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-border text-xs">
                <SelectItem value="all">All Concepts</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-[#121214] border-border text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-border text-xs">
                <SelectItem value="all">All Problems</SelectItem>
                <SelectItem value="unsolved">Unsolved Only</SelectItem>
                <SelectItem value="solved">Solved Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Problems List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProblems.map((problem) => (
              <Card key={problem.id} className="bg-[#18181b]/80 border-border/70 hover:border-accent/80 transition-all flex flex-col justify-between group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold font-headline text-foreground group-hover:text-accent transition-colors">
                      {problem.title}
                    </CardTitle>
                    {problem.is_solved && (
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {problem.description.split('\n')[0].replace(/#/g, '')}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={difficultyColors[problem.difficulty]}>
                        {problem.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="bg-[#202024] text-xs">
                        {problem.category}
                      </Badge>
                    </div>
                    <span className="text-purple-400 font-bold">+{problem.xp_reward || 10} XP</span>
                  </div>

                  <Link href={`/practice/${problem.id}`} className="block">
                    <Button className="w-full h-9 text-xs font-bold bg-secondary hover:bg-accent hover:text-white transition-all">
                      {problem.is_solved ? "Solve Again" : "Solve Problem"}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProblems.length === 0 && (
            <div className="text-center py-16 bg-[#18181b]/40 rounded-xl border border-border/40 text-muted-foreground">
              <p>No problems found matching your selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
