import React from 'react';
import { Card, CardContent, Typography, Box, SxProps, Theme } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  sx?: SxProps<Theme>;
}

export default function StatCard({ title, value, subtitle, icon, color = '#6C63FF', sx }: StatCardProps) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color, opacity: 0.8, display: 'flex' }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 0.5, fontSize: '1.75rem' }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
