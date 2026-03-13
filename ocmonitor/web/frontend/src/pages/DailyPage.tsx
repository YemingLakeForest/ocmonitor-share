import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { fetchDaily } from '../api';
import { DailyResponse } from '../types';
import { formatCost, formatTokens, costFormatter, tokenFormatter } from '../helpers';

export default function DailyPage() {
  const [data, setData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDaily()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.daily_breakdown.length === 0) return <EmptyState />;

  const days = data.daily_breakdown;
  const totalCost = days.reduce((s, d) => s + d.cost, 0);
  const totalSessions = days.reduce((s, d) => s + d.sessions, 0);
  const avgCost = totalCost / days.length;

  const chartData = days.slice(-30).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: d.cost,
    sessions: d.sessions,
    tokens: d.tokens.total,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Daily Breakdown</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{days.length} days tracked</Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Cost" value={formatCost(totalCost)} color="#00D4AA" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Avg Cost/Day" value={formatCost(avgCost)} color="#6C63FF" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Sessions" value={totalSessions} color="#FFB84D" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Daily Cost</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v: any) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
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
              <Typography variant="h6" sx={{ mb: 2 }}>Daily Tokens</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v: any) => formatTokens(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={tokenFormatter}
                  />
                  <Area type="monotone" dataKey="tokens" stroke="#00D4AA" fill="rgba(0, 212, 170, 0.15)" />
                </AreaChart>
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
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Interactions</TableCell>
                  <TableCell align="right">Input Tokens</TableCell>
                  <TableCell align="right">Output Tokens</TableCell>
                  <TableCell align="right">Total Tokens</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {days.slice().reverse().map((day) => (
                  <TableRow key={day.date} hover>
                    <TableCell>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</TableCell>
                    <TableCell align="right">{day.sessions}</TableCell>
                    <TableCell align="right">{day.interactions}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(day.tokens.input)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(day.tokens.output)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(day.tokens.total)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#00D4AA' }}>{formatCost(day.cost)}</TableCell>
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
