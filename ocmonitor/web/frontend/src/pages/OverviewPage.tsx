import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Chip } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TokenIcon from '@mui/icons-material/DataUsage';
import SessionIcon from '@mui/icons-material/PlayCircleOutline';
import InteractionIcon from '@mui/icons-material/SwapHoriz';
import StatCard from '../components/StatCard';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import { fetchSummary, fetchDaily, fetchModels } from '../api';
import { SessionsResponse, DailyResponse, ModelsResponse } from '../types';
import { formatCost, formatTokens, costFormatter, tokenFormatter, CHART_COLORS } from '../helpers';

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 },
  labelStyle: { color: '#9CA3AF' },
};

export default function OverviewPage() {
  const [data, setData] = useState<SessionsResponse | null>(null);
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchDaily(), fetchModels()])
      .then(([summaryRes, dailyRes, modelsRes]) => {
        setData(summaryRes);
        setDailyData(dailyRes);
        setModelsData(modelsRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!data?.summary) return <EmptyState message="No session data found. Start an OpenCode session to see analytics." />;

  const { summary } = data;

  // Prepare daily chart data (last 14 days)
  const dailyChartData = (dailyData?.daily_breakdown || []).slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: d.cost,
    sessions: d.sessions,
    tokens: d.tokens.total,
  }));

  // Prepare model pie chart data
  const modelPieData = (modelsData?.models || [])
    .filter((m) => m.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8)
    .map((m) => ({
      name: m.model_name,
      value: Math.round(m.cost * 100) / 100,
    }));

  // Token breakdown for the donut
  const tokenBreakdown = [
    { name: 'Input', value: summary.total_tokens.input, color: '#6C63FF' },
    { name: 'Output', value: summary.total_tokens.output, color: '#00D4AA' },
    { name: 'Cache Read', value: summary.total_tokens.cache_read, color: '#FFB84D' },
    { name: 'Cache Write', value: summary.total_tokens.cache_write, color: '#FF6B6B' },
  ].filter((t) => t.value > 0);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          {summary.date_range}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Cost"
            value={formatCost(summary.total_cost)}
            subtitle={`${summary.total_sessions} sessions`}
            icon={<AttachMoneyIcon />}
            color="#00D4AA"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Tokens"
            value={formatTokens(summary.total_tokens.total)}
            subtitle={`${formatTokens(summary.total_tokens.input)} in / ${formatTokens(summary.total_tokens.output)} out`}
            icon={<TokenIcon />}
            color="#6C63FF"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Sessions"
            value={summary.total_sessions}
            subtitle={`${summary.models_used.length} models used`}
            icon={<SessionIcon />}
            color="#FFB84D"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Interactions"
            value={summary.total_interactions.toLocaleString()}
            subtitle={`~${Math.round(summary.total_interactions / Math.max(summary.total_sessions, 1))} per session`}
            icon={<InteractionIcon />}
            color="#FF6B6B"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Daily Cost Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Daily Cost (Last 14 Days)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v: any) => `$${v}`} />
                  <Tooltip {...tooltipStyle} formatter={costFormatter} />
                  <Bar dataKey="cost" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Token Breakdown Donut */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Token Breakdown</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tokenBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {tokenBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={tokenFormatter} />
                  <Legend
                    formatter={(value: any) => <span style={{ color: '#E5E7EB', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Model Cost Breakdown */}
      {modelPieData.length > 0 && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Cost by Model</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#6B7280' }}
                    >
                      {modelPieData.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={costFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Models Used</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {summary.models_used.map((model) => (
                    <Chip
                      key={model}
                      label={model}
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: 'rgba(108, 99, 255, 0.4)', color: 'text.primary' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
