import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { fetchMonthly } from '../api';
import { MonthlyResponse } from '../types';
import { formatCost, formatTokens, monthName, costFormatter } from '../helpers';

export default function MonthlyPage() {
  const [data, setData] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthly()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.monthly_breakdown.length === 0) return <EmptyState />;

  const months = data.monthly_breakdown;
  const totalCost = months.reduce((s, m) => s + m.cost, 0);
  const totalSessions = months.reduce((s, m) => s + m.sessions, 0);
  const avgCost = totalCost / months.length;

  const chartData = months.map((m) => ({
    label: `${monthName(m.month)} ${m.year}`,
    cost: m.cost,
    sessions: m.sessions,
    tokens: m.tokens.total,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Monthly Breakdown</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{months.length} months tracked</Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Cost" value={formatCost(totalCost)} color="#00D4AA" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Avg Cost/Month" value={formatCost(avgCost)} color="#6C63FF" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Sessions" value={totalSessions} color="#FFB84D" />
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Monthly Cost</Typography>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
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

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Interactions</TableCell>
                  <TableCell align="right">Input Tokens</TableCell>
                  <TableCell align="right">Output Tokens</TableCell>
                  <TableCell align="right">Total Tokens</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {months.slice().reverse().map((m) => (
                  <TableRow key={`${m.year}-${m.month}`} hover>
                    <TableCell>{monthName(m.month)} {m.year}</TableCell>
                    <TableCell align="right">{m.sessions}</TableCell>
                    <TableCell align="right">{m.interactions}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(m.tokens.input)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(m.tokens.output)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(m.tokens.total)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#00D4AA' }}>{formatCost(m.cost)}</TableCell>
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
