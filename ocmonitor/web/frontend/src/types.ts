// API response types for OpenCode Monitor

export interface TokenUsage {
  input: number;
  output: number;
  cache_write: number;
  cache_read: number;
  total: number;
}

export interface SessionSummary {
  session_id: string;
  session_title: string | null;
  project_name: string;
  interaction_count: number;
  total_tokens: TokenUsage;
  total_cost: number;
  models_used: string[];
  start_time: string | null;
  end_time: string | null;
}

export interface SummaryStats {
  total_sessions: number;
  total_interactions: number;
  total_tokens: TokenUsage;
  total_cost: number;
  models_used: string[];
  date_range: string;
}

export interface SessionsResponse {
  summary: SummaryStats | null;
  sessions: SessionSummary[];
}

export interface DailyEntry {
  date: string;
  sessions: number;
  interactions: number;
  tokens: TokenUsage;
  cost: number;
  models_used: string[];
}

export interface DailyResponse {
  daily_breakdown: DailyEntry[];
}

export interface WeeklyEntry {
  year: number;
  week: number;
  start_date: string;
  end_date: string;
  sessions: number;
  interactions: number;
  tokens: TokenUsage;
  cost: number;
}

export interface WeeklyResponse {
  weekly_breakdown: WeeklyEntry[];
}

export interface MonthlyEntry {
  year: number;
  month: number;
  sessions: number;
  interactions: number;
  tokens: TokenUsage;
  cost: number;
}

export interface MonthlyResponse {
  monthly_breakdown: MonthlyEntry[];
}

export interface ModelEntry {
  model_name: string;
  sessions: number;
  interactions: number;
  tokens: TokenUsage;
  cost: number;
  p50_output_rate: number;
  first_used: string | null;
  last_used: string | null;
}

export interface ModelsResponse {
  timeframe: string;
  start_date: string | null;
  end_date: string | null;
  total_cost: number;
  total_tokens: TokenUsage;
  models: ModelEntry[];
}

export interface ProjectEntry {
  project_name: string;
  sessions: number;
  interactions: number;
  tokens: TokenUsage;
  cost: number;
  models_used: string[];
  first_activity: string | null;
  last_activity: string | null;
}

export interface ProjectsResponse {
  timeframe: string;
  start_date: string | null;
  end_date: string | null;
  total_cost: number;
  total_tokens: TokenUsage;
  projects: ProjectEntry[];
}

// ── Live Monitoring Types ────────────────────────────────────────────

export interface LiveModelBreakdown {
  model_id: string;
  interactions: number;
  tokens: TokenUsage;
  cost: number;
  p50_output_rate: number;
  context_size: number;
  context_window: number;
  context_pct: number;
}

export interface LiveToolStat {
  tool_name: string;
  total_calls: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
}

export interface LiveRecentInteraction {
  model_id: string;
  tokens: TokenUsage;
  cost: number;
  duration_ms: number | null;
  agent: string | null;
  session_id?: string;
}

export interface LiveSession {
  session_id: string;
  session_title: string | null;
  project_name: string;
  agent: string | null;
  is_sub_agent: boolean;
  interaction_count: number;
  tokens: TokenUsage;
  cost: number;
  quota: number;
  quota_pct: number;
  models_used: string[];
  model_breakdown: LiveModelBreakdown[];
  start_time: string | null;
  end_time: string | null;
  duration_ms: number;
  duration_hours: number;
  duration_pct: number;
}

export interface LiveWorkflow {
  workflow_id: string;
  display_title: string;
  project_name: string;
  session_count: number;
  sub_agent_count: number;
  has_sub_agents: boolean;
  activity_status: 'active' | 'recent' | 'idle' | 'inactive';
  last_activity_ago: number | null;
  tokens: TokenUsage;
  cost: number;
  quota: number;
  quota_pct: number;
  start_time: string | null;
  end_time: string | null;
  duration_ms: number;
  duration_hours: number;
  duration_pct: number;
  recent_interaction: LiveRecentInteraction | null;
  model_breakdown: LiveModelBreakdown[];
  tool_stats: LiveToolStat[];
  sessions: LiveSession[];
}

export interface LiveResponse {
  timestamp: string;
  workflow_count: number;
  workflows: LiveWorkflow[];
}
