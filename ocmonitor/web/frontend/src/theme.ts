import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6C63FF',
      light: '#9D97FF',
      dark: '#4A42CC',
    },
    secondary: {
      main: '#00D4AA',
      light: '#33DDBB',
      dark: '#00A888',
    },
    background: {
      default: '#0A0E1A',
      paper: '#111827',
    },
    error: {
      main: '#FF6B6B',
    },
    warning: {
      main: '#FFB84D',
    },
    success: {
      main: '#00D4AA',
    },
    info: {
      main: '#6C63FF',
    },
    text: {
      primary: '#E5E7EB',
      secondary: '#9CA3AF',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      color: '#9CA3AF',
    },
    body2: {
      color: '#9CA3AF',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'border-color 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(108, 99, 255, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        },
        head: {
          fontWeight: 600,
          color: '#9CA3AF',
          fontSize: '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          backgroundColor: '#0D1117',
        },
      },
    },
  },
});

export default theme;
