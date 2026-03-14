// API client for OpenCode Monitor backend

import {
  SessionsResponse,
  DailyResponse,
  WeeklyResponse,
  MonthlyResponse,
  ModelsResponse,
  ProjectsResponse,
  LiveResponse,
} from './types';

const API_BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  return response.json();
}

export async function fetchSummary(): Promise<SessionsResponse> {
  return fetchJson<SessionsResponse>('/summary');
}

export async function fetchSessions(limit?: number): Promise<SessionsResponse> {
  const params = limit ? `?limit=${limit}` : '';
  return fetchJson<SessionsResponse>(`/sessions${params}`);
}

export async function fetchDaily(month?: string): Promise<DailyResponse> {
  const params = month ? `?month=${month}` : '';
  return fetchJson<DailyResponse>(`/daily${params}`);
}

export async function fetchWeekly(year?: number): Promise<WeeklyResponse> {
  const params = year ? `?year=${year}` : '';
  return fetchJson<WeeklyResponse>(`/weekly${params}`);
}

export async function fetchMonthly(year?: number): Promise<MonthlyResponse> {
  const params = year ? `?year=${year}` : '';
  return fetchJson<MonthlyResponse>(`/monthly${params}`);
}

export async function fetchModels(): Promise<ModelsResponse> {
  return fetchJson<ModelsResponse>('/models');
}

export async function fetchProjects(): Promise<ProjectsResponse> {
  return fetchJson<ProjectsResponse>('/projects');
}

export async function fetchLive(): Promise<LiveResponse> {
  return fetchJson<LiveResponse>('/live');
}
