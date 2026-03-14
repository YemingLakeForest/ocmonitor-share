import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Chip, TextField, TablePagination,
} from '@mui/material';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/LoadingState';
import { fetchSessions } from '../api';
import { SessionsResponse, SessionSummary } from '../types';
import { formatCost, formatTokens, formatDateTime } from '../helpers';

type SortKey = 'title' | 'project' | 'interactions' | 'tokens' | 'cost' | 'started';
type SortDir = 'asc' | 'desc';

function getSortValue(session: SessionSummary, key: SortKey): string | number {
  switch (key) {
    case 'title':        return (session.session_title || session.session_id).toLowerCase();
    case 'project':      return session.project_name.toLowerCase();
    case 'interactions': return session.interaction_count;
    case 'tokens':       return session.total_tokens.total;
    case 'cost':         return session.total_cost;
    case 'started':      return session.start_time || '';
    default:             return 0;
  }
}

export default function SessionsPage() {
  const [data, setData] = useState<SessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortKey, setSortKey] = useState<SortKey>('started');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchSessions()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'title' || key === 'project' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.sessions.filter((s) =>
      (s.session_title || '').toLowerCase().includes(q) ||
      s.project_name.toLowerCase().includes(q) ||
      s.session_id.toLowerCase().includes(q) ||
      s.models_used.some((m) => m.toLowerCase().includes(q))
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.sessions.length === 0) return <EmptyState />;

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'title', label: 'Title' },
    { key: 'project', label: 'Project' },
    { key: 'interactions', label: 'Interactions', align: 'right' },
    { key: 'tokens', label: 'Tokens', align: 'right' },
    { key: 'cost', label: 'Cost', align: 'right' },
  ];

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
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align} sortDirection={sortKey === col.key ? sortDir : false}>
                      <TableSortLabel
                        active={sortKey === col.key}
                        direction={sortKey === col.key ? sortDir : 'asc'}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Models</TableCell>
                  <TableCell sortDirection={sortKey === 'started' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'started'}
                      direction={sortKey === 'started' ? sortDir : 'asc'}
                      onClick={() => handleSort('started')}
                    >
                      Started
                    </TableSortLabel>
                  </TableCell>
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
            count={sorted.length}
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
