import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, IconButton, Tooltip as MuiTooltip,
} from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimerIcon from '@mui/icons-material/Timer';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { fetchLive } from '../api';
import { LiveResponse, LiveWorkflow } from '../types';
import { formatCost, formatTokens, CHART_COLORS } from '../helpers';

const STATUS_COLORS: Record<string, string> = {
  active: '#00D4AA',
  recent: '#FFB84D',
  idle: '#FF6B6B',
  inactive: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  recent: 'Recent',
  idle: 'Idle',
  inactive: 'Inactive',
};

function formatAgo(seconds: number | null): string {
  if (seconds === null) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${(seconds / 3600).toFixed(1)}h ago`;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '-';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ProgressBar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  return (
    <LinearProgress
      variant="determinate"
      value={Math.min(value, 100)}
      sx={{
        height,
        borderRadius: height / 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: height / 2 },
      }}
    />
  );
}

function rateLevel(rate: number): { label: string; color: string } {
  if (rate > 90) return { label: 'VERY FAST', color: '#00D4AA' };
  if (rate > 60) return { label: 'FAST', color: '#00D4AA' };
  if (rate >= 25) return { label: 'MEDIUM', color: '#FFB84D' };
  return { label: 'SLOW', color: '#FF6B6B' };
}

function contextColor(pct: number): string {
  if (pct > 80) return '#FF6B6B';
  if (pct > 50) return '#FFB84D';
  return '#00D4AA';
}

function costProgressColor(pct: number): string {
  if (pct > 80) return '#FF6B6B';
  if (pct > 50) return '#FFB84D';
  return '#00D4AA';
}

// ── Workflow Detail Card ─────────────────────────────────────────────

function WorkflowDetail({ wf }: { wf: LiveWorkflow }) {
  const tokenBreakdown = [
    { name: 'Input', value: wf.tokens.input, color: '#6C63FF' },
    { name: 'Output', value: wf.tokens.output, color: '#00D4AA' },
    { name: 'Cache Read', value: wf.tokens.cache_read, color: '#FFB84D' },
    { name: 'Cache Write', value: wf.tokens.cache_write, color: '#FF6B6B' },
  ].filter((t) => t.value > 0);

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 2.5, borderLeft: `3px solid ${STATUS_COLORS[wf.activity_status]}` }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <FiberManualRecordIcon sx={{ fontSize: 10, color: STATUS_COLORS[wf.activity_status] }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {wf.display_title}
                </Typography>
                <Chip label={STATUS_LABELS[wf.activity_status]} size="small"
                  sx={{ backgroundColor: `${STATUS_COLORS[wf.activity_status]}22`, color: STATUS_COLORS[wf.activity_status], fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {wf.project_name}
                {wf.has_sub_agents && ` | ${wf.session_count} sessions (1 main + ${wf.sub_agent_count} sub-agents)`}
                {` | Last activity: ${formatAgo(wf.last_activity_ago)}`}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="Cost" value={formatCost(wf.cost)}
            subtitle={wf.quota > 0 ? `${wf.quota_pct}% of $${wf.quota.toFixed(2)} quota` : undefined}
            color={wf.quota > 0 ? costProgressColor(wf.quota_pct) : '#00D4AA'} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="Tokens" value={formatTokens(wf.tokens.total)}
            subtitle={`${formatTokens(wf.tokens.input)} in / ${formatTokens(wf.tokens.output)} out`}
            color="#6C63FF" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="Duration" value={formatDuration(wf.duration_ms)}
            subtitle={`${wf.duration_pct.toFixed(0)}% of 5h max`}
            color="#FFB84D" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="Interactions" value={wf.sessions.reduce((s, x) => s + x.interaction_count, 0)}
            subtitle={`${wf.session_count} session${wf.session_count > 1 ? 's' : ''}`}
            color="#FF6B6B" />
        </Grid>
      </Grid>

      {/* Progress Bars */}
      {wf.quota > 0 && (
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>Cost Quota</Typography>
              <Box sx={{ flexGrow: 1 }}><ProgressBar value={wf.quota_pct} color={costProgressColor(wf.quota_pct)} height={8} /></Box>
              <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'right', fontFamily: 'monospace' }}>{wf.quota_pct.toFixed(1)}%</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>Duration</Typography>
              <Box sx={{ flexGrow: 1 }}><ProgressBar value={wf.duration_pct} color="#FFB84D" height={8} /></Box>
              <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'right', fontFamily: 'monospace' }}>{wf.duration_pct.toFixed(1)}%</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* Recent Interaction + Token Donut */}
        <Grid size={{ xs: 12, md: 4 }}>
          {wf.recent_interaction && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Recent Interaction
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{wf.recent_interaction.model_id}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Input:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>{formatTokens(wf.recent_interaction.tokens.input)}</Typography>
                  <Typography variant="body2" color="text.secondary">Output:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>{formatTokens(wf.recent_interaction.tokens.output)}</Typography>
                  <Typography variant="body2" color="text.secondary">Cache Read:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>{formatTokens(wf.recent_interaction.tokens.cache_read)}</Typography>
                  <Typography variant="body2" color="text.secondary">Cost:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'right', color: '#00D4AA' }}>{formatCost(wf.recent_interaction.cost)}</Typography>
                  {wf.recent_interaction.duration_ms && (
                    <>
                      <Typography variant="body2" color="text.secondary">Duration:</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>{(wf.recent_interaction.duration_ms / 1000).toFixed(1)}s</Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
          {tokenBreakdown.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Token Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tokenBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {tokenBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      formatter={(value: any) => [formatTokens(Number(value)), '']} />
                    <Legend formatter={(value: any) => <span style={{ color: '#E5E7EB', fontSize: 11 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Per-Model Breakdown */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', px: 2, pt: 2, pb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                Model Breakdown
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell align="right">Interactions</TableCell>
                      <TableCell align="right">Tokens</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Output Rate</TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Context</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wf.model_breakdown.map((m, i) => {
                      const rl = rateLevel(m.p50_output_rate);
                      return (
                        <TableRow key={m.model_id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{m.model_id}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{m.interactions}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(m.tokens.total)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#00D4AA' }}>{formatCost(m.cost)}</TableCell>
                          <TableCell align="right">
                            {m.p50_output_rate > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{m.p50_output_rate}</Typography>
                                <Typography variant="caption" sx={{ color: rl.color, fontWeight: 600 }}>tok/s</Typography>
                              </Box>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {m.context_window > 0 ? (
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                  <Typography variant="caption" color="text.secondary">{formatTokens(m.context_size)}/{formatTokens(m.context_window)}</Typography>
                                  <Typography variant="caption" sx={{ color: contextColor(m.context_pct), fontWeight: 600 }}>{m.context_pct}%</Typography>
                                </Box>
                                <ProgressBar value={m.context_pct} color={contextColor(m.context_pct)} height={4} />
                              </Box>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Tool Stats */}
          {wf.tool_stats.length > 0 && (
            <Card sx={{ mt: 2.5 }}>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', px: 2, pt: 2, pb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  Tool Usage
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tool</TableCell>
                        <TableCell align="right">Calls</TableCell>
                        <TableCell align="right">Success</TableCell>
                        <TableCell align="right">Failures</TableCell>
                        <TableCell sx={{ minWidth: 110 }}>Success Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {wf.tool_stats.slice(0, 15).map((t) => {
                        const toolColor = t.success_rate >= 90 ? '#00D4AA' : t.success_rate >= 70 ? '#FFB84D' : '#FF6B6B';
                        return (
                          <TableRow key={t.tool_name} hover>
                            <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{t.tool_name}</Typography></TableCell>
                            <TableCell align="right">{t.total_calls}</TableCell>
                            <TableCell align="right" sx={{ color: '#00D4AA' }}>{t.success_count}</TableCell>
                            <TableCell align="right" sx={{ color: t.failure_count > 0 ? '#FF6B6B' : 'text.secondary' }}>{t.failure_count}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ flexGrow: 1 }}><ProgressBar value={t.success_rate} color={toolColor} height={4} /></Box>
                                <Typography variant="caption" sx={{ color: toolColor, fontWeight: 600, minWidth: 32 }}>{t.success_rate}%</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Sub-agent sessions */}
      {wf.has_sub_agents && (
        <Card>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', px: 2, pt: 2, pb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              Sessions ({wf.session_count})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Session</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell align="right">Interactions</TableCell>
                    <TableCell align="right">Tokens</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell>Models</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wf.sessions.map((s, i) => (
                    <TableRow key={s.session_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!s.is_sub_agent && <Chip label="MAIN" size="small" sx={{ fontSize: '0.6rem', height: 18, backgroundColor: 'rgba(108,99,255,0.15)', color: '#6C63FF', fontWeight: 700 }} />}
                          <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.session_title || s.session_id.slice(0, 16) + '...'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.agent || 'main'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </TableCell>
                      <TableCell align="right">{s.interaction_count}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatTokens(s.tokens.total)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#00D4AA' }}>{formatCost(s.cost)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {s.models_used.slice(0, 2).map((m) => (
                            <Chip key={m} label={m} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18, borderColor: 'rgba(108,99,255,0.3)' }} />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ── Main Live Page ───────────────────────────────────────────────────

export default function LivePage() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    fetchLive()
      .then((res) => {
        setData(res);
        setError(null);
        setLastRefresh(new Date());
        // Auto-select first workflow if nothing selected
        if (!selectedId && res.workflows.length > 0) {
          setSelectedId(res.workflows[0].workflow_id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  // Initial load + polling
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refresh, refreshInterval]);

  if (loading && !data) return <LoadingSpinner message="Connecting to live data..." />;

  const workflows = data?.workflows || [];
  const selected = workflows.find((w) => w.workflow_id === selectedId) || workflows[0] || null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>Live Monitor</Typography>
          <Typography variant="body2" color="text.secondary">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
            {lastRefresh && ` | Updated ${lastRefresh.toLocaleTimeString()}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <ToggleButtonGroup
            value={refreshInterval}
            exclusive
            onChange={(_, val) => val !== null && setRefreshInterval(val)}
            size="small"
          >
            <ToggleButton value={3} sx={{ px: 1.5, py: 0.3, fontSize: '0.75rem' }}>3s</ToggleButton>
            <ToggleButton value={5} sx={{ px: 1.5, py: 0.3, fontSize: '0.75rem' }}>5s</ToggleButton>
            <ToggleButton value={10} sx={{ px: 1.5, py: 0.3, fontSize: '0.75rem' }}>10s</ToggleButton>
            <ToggleButton value={30} sx={{ px: 1.5, py: 0.3, fontSize: '0.75rem' }}>30s</ToggleButton>
          </ToggleButtonGroup>
          <MuiTooltip title="Refresh now">
            <IconButton size="small" onClick={refresh}><RefreshIcon fontSize="small" /></IconButton>
          </MuiTooltip>
        </Box>
      </Box>

      {error && <ErrorAlert message={error} />}

      {workflows.length === 0 && !loading && (
        <EmptyState message="No active workflows found. Start an OpenCode session to see live data." />
      )}

      {/* Workflow selector (when multiple) */}
      {workflows.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
          {workflows.map((wf) => (
            <Chip
              key={wf.workflow_id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 8, color: STATUS_COLORS[wf.activity_status] }} />
                  {wf.display_title || wf.project_name}
                </Box>
              }
              onClick={() => setSelectedId(wf.workflow_id)}
              variant={selectedId === wf.workflow_id ? 'filled' : 'outlined'}
              sx={{
                borderColor: selectedId === wf.workflow_id ? 'primary.main' : 'rgba(255,255,255,0.15)',
                backgroundColor: selectedId === wf.workflow_id ? 'rgba(108,99,255,0.15)' : 'transparent',
              }}
            />
          ))}
        </Box>
      )}

      {/* Selected workflow detail */}
      {selected && <WorkflowDetail wf={selected} />}
    </Box>
  );
}
