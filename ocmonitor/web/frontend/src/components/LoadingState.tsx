import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
      <CircularProgress sx={{ color: 'primary.main', mb: 2 }} />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      {message}
    </Alert>
  );
}

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
      <Typography variant="body1" color="text.secondary">{message}</Typography>
    </Box>
  );
}
