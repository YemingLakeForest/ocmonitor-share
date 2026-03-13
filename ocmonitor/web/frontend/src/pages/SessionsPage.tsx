import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, TablePagination,
} from '@mui/material';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import { fetchSessions } from '../api';
import { SessionsResponse } from '../types';
import { formatCost, formatTokens, formatDateTime } from '../helpers';

export default function SessionsPage() {
  const [data, setData] = useState<SessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    fetchSessions()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.sessions.length === 0) return <EmptyState />;

  const filtered = data.sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.session_title || '').toLowerCase().includes(q) ||
      s.project_name.toLowerCase().includes(q) ||
      s.session_id.toLowerCase().includes(q) ||
      s.models_used.some((m) => m.toLowerCase().includes(q))
    );
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Sessions</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data.summary
          ? `${data.summary.total_sessions} sessions | ${formatCost(data.summary.total_cost)} total cost`
          : ''}
      </Typography>

      <TextField
        placeholder="Search sessions..."
        size="small"
        fullWidth
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Interactions</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell>Models</TableCell>
                  <TableCell>Started</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((session) => (
                  <TableRow key={session.session_id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.session_title || session.session_id.slice(0, 12) + '...'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{session.project_name}</Typography>
                    </TableCell>
                    <TableCell align="right">{session.interaction_count}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {formatTokens(session.total_tokens.total)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: session.total_cost > 1 ? '#FF6B6B' : '#00D4AA' }}>
                        {formatCost(session.total_cost)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {session.models_used.slice(0, 2).map((m) => (
                          <Chip key={m} label={m} size="small" variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 22, borderColor: 'rgba(108,99,255,0.3)' }}
                          />
                        ))}
                        {session.models_used.length > 2 && (
                          <Chip label={`+${session.models_used.length - 2}`} size="small"
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {formatDateTime(session.start_time)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
