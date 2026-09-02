export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type TestCase = {
  input: string;
  expectedOutput: string;
  explanation?: string;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  concept_id?: string;
  level_number?: number;
  xp_reward?: number;
  examples?: { input: string; output: string; explanation?: string }[];
  starter_code?: { [key: string]: string };
  defaultCode?: string;
  testCases?: TestCase[];
  hints?: string[];
  is_solved?: boolean;
};

export type LevelInfo = {
  level: number;
  xp: number;
  current_level_base_xp: number;
  next_level_base_xp: number;
  xp_in_level: number;
  xp_needed_for_level: number;
  progress_percentage: number;
};

export type User = {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  total_points: number;
  coins: number;
  rating: number;
  wins: number;
  losses: number;
  streak: number;
  longest_streak: number;
  problems_solved: number;
  hard_problems_solved?: number;
  level_info?: LevelInfo;
  created_at?: string;
};

export type ConceptLevel = {
  level_number: number;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  total_problems: number;
  solved_problems: number;
  progress_percentage: number;
  problem_ids?: string[];
};

export type DSAConcept = {
  concept_id: string;
  name: string;
  icon?: string;
  description?: string;
  current_level: number;
  total_levels: number;
  mastery_percentage: number;
  total_problems: number;
  solved_problems: number;
  levels?: ConceptLevel[];
};

export type RoadmapData = {
  overall_dsa_progress: number;
  concepts: DSAConcept[];
  next_recommended_concept: string;
};

export type Badge = {
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  unlocked?: boolean;
  unlocked_at?: string;
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  username: string;
  avatar?: string;
  level: number;
  rating: number;
  total_points: number;
  wins: number;
  losses: number;
  win_rate: number;
  is_current_user?: boolean;
};

export type BattlePlayer = {
  user_id: string;
  username: string;
  avatar?: string;
  rating: number;
  connected: boolean;
  passed_test_cases: number;
  total_test_cases: number;
  progress_percentage: number;
};

export type BattleRoomState = {
  battle_id: string;
  problem_id: string;
  status: 'active' | 'completed' | 'timeout';
  start_time: number;
  duration_seconds: number;
  remaining_seconds: number;
  winner_id?: string;
  is_draw?: boolean;
  players: { [user_id: string]: BattlePlayer };
};

export type ExecutionResult = {
  status: string;
  success: boolean;
  total_test_cases: number;
  passed_test_cases: number;
  runtime_ms: number;
  test_results: {
    case_number: number;
    input: string;
    expected_output: string;
    actual_output: string;
    passed: boolean;
    error?: string;
    runtime_ms?: number;
  }[];
  error?: string;
};
