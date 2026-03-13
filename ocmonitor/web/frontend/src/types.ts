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
