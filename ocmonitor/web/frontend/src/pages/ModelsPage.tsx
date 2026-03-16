import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { fetchModels } from '../api';
import { ModelsResponse } from '../types';
import { formatCost, formatTokens, formatDate, costFormatter, CHART_COLORS } from '../helpers';

export default function ModelsPage() {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.models.length === 0) return <EmptyState />;

  const models = data.models.sort((a, b) => b.cost - a.cost);
  const maxCost = Math.max(...models.map((m) => m.cost), 0.01);

  const pieData = models
    .filter((m) => m.cost > 0)
    .slice(0, 8)
    .map((m) => ({ name: m.model_name, value: Math.round(m.cost * 100) / 100 }));

  const barData = models.slice(0, 10).map((m) => ({
    name: m.model_name.length > 20 ? m.model_name.slice(0, 18) + '...' : m.model_name,
    cost: m.cost,
    sessions: m.sessions,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Models</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {models.length} models | {formatCost(data.total_cost)} total cost
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Cost" value={formatCost(data.total_cost)} color="#00D4AA" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Models Used" value={models.length} color="#6C63FF" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Tokens" value={formatTokens(data.total_tokens.total)} color="#FFB84D" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Cost by Model</Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v: any) => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={150} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={costFormatter}
                  />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                    {barData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Cost Distribution</Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={costFormatter}
                  />
                  <Legend formatter={(value: any) => <span style={{ color: '#E5E7EB', fontSize: 11 }}>{value}</span>} />
                </PieChart>
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
                  <TableCell>Model</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Interactions</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Output Rate</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Cost Share</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell>Last Used</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {models.map((m, i) => {
                  const pct = maxCost > 0 ? (m.cost / maxCost) * 100 : 0;
                  return (
                    <TableRow key={m.model_name} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{m.model_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{m.sessions}</TableCell>
                      <TableCell align="right">{m.interactions}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(m.tokens.total)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {m.p50_output_rate > 0 ? `${m.p50_output_rate.toFixed(1)} tok/s` : '-'}
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6, borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            '& .MuiLinearProgress-bar': { backgroundColor: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 3 },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#00D4AA' }}>{formatCost(m.cost)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {formatDate(m.last_used)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
