import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FolderIcon from '@mui/icons-material/Folder';
import MenuIcon from '@mui/icons-material/Menu';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SensorsIcon from '@mui/icons-material/Sensors';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Overview', path: '/', icon: <DashboardIcon /> },
  { label: 'Live', path: '/live', icon: <SensorsIcon /> },
  { label: 'Sessions', path: '/sessions', icon: <ListAltIcon /> },
  { label: 'Daily', path: '/daily', icon: <CalendarTodayIcon /> },
  { label: 'Weekly', path: '/weekly', icon: <DateRangeIcon /> },
  { label: 'Monthly', path: '/monthly', icon: <CalendarMonthIcon /> },
  { label: 'Models', path: '/models', icon: <SmartToyIcon /> },
  { label: 'Projects', path: '/projects', icon: <FolderIcon /> },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const drawer = (
    <Box sx={{ pt: 2 }}>
      <Box sx={{ px: 2.5, pb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <MonitorHeartIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          OCMonitor
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              selected={selected}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(108, 99, 255, 0.12)',
                  '&:hover': { backgroundColor: 'rgba(108, 99, 255, 0.18)' },
                },
              }}
            >
              <ListItemIcon
                sx={{ minWidth: 40, color: selected ? 'primary.main' : 'text.secondary' }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: selected ? 600 : 400,
                  fontSize: '0.875rem',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <MonitorHeartIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              OCMonitor
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                borderRight: '1px solid',
                borderColor: 'divider',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: isMobile ? 8 : 0,
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
