import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { fetchWeekly } from '../api';
import { WeeklyResponse } from '../types';
import { formatCost, formatTokens, formatDate, costFormatter } from '../helpers';

export default function WeeklyPage() {
  const [data, setData] = useState<WeeklyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeekly()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.weekly_breakdown.length === 0) return <EmptyState />;

  const weeks = data.weekly_breakdown;
  const totalCost = weeks.reduce((s, w) => s + w.cost, 0);
  const totalSessions = weeks.reduce((s, w) => s + w.sessions, 0);
  const avgCost = totalCost / weeks.length;

  const chartData = weeks.slice(-12).map((w) => ({
    label: `W${w.week}`,
    range: `${formatDate(w.start_date)} - ${formatDate(w.end_date)}`,
    cost: w.cost,
    sessions: w.sessions,
    tokens: w.tokens.total,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Weekly Breakdown</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{weeks.length} weeks tracked</Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Cost" value={formatCost(totalCost)} color="#00D4AA" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Avg Cost/Week" value={formatCost(avgCost)} color="#6C63FF" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Sessions" value={totalSessions} color="#FFB84D" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Weekly Cost</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v: any) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.range || ''}
                    formatter={costFormatter}
                  />
                  <Bar dataKey="cost" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Sessions per Week</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.range || ''}
                  />
                  <Line type="monotone" dataKey="sessions" stroke="#00D4AA" strokeWidth={2} dot={{ fill: '#00D4AA', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Week</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Interactions</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {weeks.slice().reverse().map((w) => (
                  <TableRow key={`${w.year}-${w.week}`} hover>
                    <TableCell>W{w.week} {w.year}</TableCell>
                    <TableCell>{formatDate(w.start_date)} - {formatDate(w.end_date)}</TableCell>
                    <TableCell align="right">{w.sessions}</TableCell>
                    <TableCell align="right">{w.interactions}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(w.tokens.total)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#00D4AA' }}>{formatCost(w.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
