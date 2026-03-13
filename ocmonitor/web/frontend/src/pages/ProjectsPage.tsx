import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { fetchProjects } from '../api';
import { ProjectsResponse } from '../types';
import { formatCost, formatTokens, formatDate, costFormatter, CHART_COLORS } from '../helpers';

export default function ProjectsPage() {
  const [data, setData] = useState<ProjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.projects.length === 0) return <EmptyState />;

  const projects = data.projects.sort((a, b) => b.cost - a.cost);
  const maxCost = Math.max(...projects.map((p) => p.cost), 0.01);

  const barData = projects.slice(0, 10).map((p) => ({
    name: p.project_name.length > 22 ? p.project_name.slice(0, 20) + '...' : p.project_name,
    cost: p.cost,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Projects</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {projects.length} projects | {formatCost(data.total_cost)} total cost
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Cost" value={formatCost(data.total_cost)} color="#00D4AA" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Projects" value={projects.length} color="#6C63FF" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Tokens" value={formatTokens(data.total_tokens.total)} color="#FFB84D" />
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Cost by Project</Typography>
          <ResponsiveContainer width="100%" height={Math.max(200, projects.slice(0, 10).length * 40)}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v: any) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={170} />
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

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Interactions</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Cost Share</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell>Models</TableCell>
                  <TableCell>Last Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((p, i) => {
                  const pct = maxCost > 0 ? (p.cost / maxCost) * 100 : 0;
                  return (
                    <TableRow key={p.project_name} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.project_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{p.sessions}</TableCell>
                      <TableCell align="right">{p.interactions}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(p.tokens.total)}</TableCell>
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
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#00D4AA' }}>{formatCost(p.cost)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {p.models_used.slice(0, 2).map((m) => (
                            <Chip key={m} label={m} size="small" variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20, borderColor: 'rgba(108,99,255,0.3)' }}
                            />
                          ))}
                          {p.models_used.length > 2 && (
                            <Chip label={`+${p.models_used.length - 2}`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {formatDate(p.last_activity)}
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
