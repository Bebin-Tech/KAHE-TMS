import React, { useEffect, useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  IconButton, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar,
  useTheme, useMediaQuery, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  DashboardOutlined,
  PeopleOutlined,
  AssignmentOutlined,
  AssessmentOutlined,
  SettingsOutlined,
  BusinessOutlined,
  Menu as MenuIcon,
  ExitToAppRounded,
  AssignmentTurnedInOutlined
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 292;

const DashboardLayout = ({ children, title, hideSidebar = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [pressedPath, setPressedPath] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => setOpen(!open);
  const handleNavigate = (path) => {
    setPressedPath(path);
    navigate(path);
    if (isMobile) setOpen(false);
    window.setTimeout(() => setPressedPath(''), 160);
  };
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: `/${user.role?.toLowerCase()}-dashboard` },
    ...(user.role === 'ADMIN' ? [
      { text: 'Department', icon: <BusinessOutlined />, path: '/department-management' }
    ] : []),
    { text: 'Task', icon: <AssignmentOutlined />, path: '/tasks' },
    { text: 'Completed Task', icon: <AssignmentTurnedInOutlined />, path: '/completed-tasks' },
    { text: 'Report', icon: <AssessmentOutlined />, path: '/reports' },
    ...(user.role === 'ADMIN' ? [
      { text: 'User', icon: <PeopleOutlined />, path: '/user-management' }
    ] : []),
    { text: 'Settings', icon: <SettingsOutlined />, path: '/settings' },
  ];

  const roleLabel = user.role ? user.role.replace('_', ' ') : 'Member';
  const loginLabel = user.full_name || roleLabel;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa', color: '#1E1E2C', px: 2.25 }}>
      <Box sx={{ py: 3.25, px: 1.25, display: 'flex', alignItems: 'center', gap: 1.6 }}>
        <Box
          sx={{
            bgcolor: 'white',
            p: 0.55,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            border: '1px solid #e5e2df',
            boxShadow: '0 18px 38px -22px rgba(30,30,44,0.32)'
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="KAHE Logo"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 900, color: '#1E1E2C', letterSpacing: 0, lineHeight: 1.1 }}>
            KAHE TMS
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 0.5, mb: 3 }}>
        <Paper elevation={0} sx={{
          p: 2,
          bgcolor: '#ffffff',
          border: '1px solid #e5e2df',
          boxShadow: '0 16px 34px -28px rgba(30,30,44,0.42)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: '#1E1E2C'
        }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'white', color: 'primary.dark', fontWeight: 900 }}>
            {(user.username?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: '#1E1E2C' }}>
              {user.full_name || user.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#1f7f79', fontWeight: 700 }}>
              {roleLabel}
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Typography variant="caption" sx={{ px: 1.5, mb: 1.25, color: '#5f756f', fontWeight: 900, letterSpacing: '0.08em' }}>
        WORKSPACE
      </Typography>
      <List sx={{ px: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isPressed = pressedPath === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                disableRipple
                onClick={() => handleNavigate(item.path)}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  bgcolor: isActive ? '#eaf3ff' : 'transparent',
                  color: '#1E1E2C',
                  border: isActive ? '1px solid rgba(59,143,243,0.42)' : '1px solid transparent',
                  transform: isPressed ? 'scale(0.975)' : 'scale(1)',
                  transition: 'transform 140ms ease, background-color 220ms ease, border-color 220ms ease, color 220ms ease, box-shadow 220ms ease',
                  boxShadow: isActive ? '0 12px 26px -18px rgba(35,125,186,0.7)' : 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: 4,
                    height: isActive ? 28 : 0,
                    borderRadius: '0 999px 999px 0',
                    bgcolor: '#3B8FF3',
                    transform: 'translateY(-50%)',
                    opacity: isActive ? 1 : 0,
                    transition: 'height 240ms ease, opacity 180ms ease'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                    transform: isPressed ? 'translateX(0)' : 'translateX(-115%)',
                    opacity: isPressed ? 1 : 0,
                    transition: 'transform 260ms ease, opacity 180ms ease',
                    pointerEvents: 'none'
                  },
                  '&:hover': {
                    bgcolor: isActive ? '#eaf3ff' : '#ffffff',
                    transform: isPressed ? 'scale(0.975)' : 'translateX(4px)',
                    borderColor: '#e5e2df'
                  },
                  '&:active': {
                    transform: 'scale(0.975)'
                  },
                  py: 1.35
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? '#237dba' : '#5f756f',
                  minWidth: '44px',
                  transition: 'color 220ms ease, transform 220ms ease',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  '& svg': { fontSize: '1.35rem' }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 800 : 600,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!hideSidebar && (
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? open : true}
          onClose={handleDrawerToggle}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #d7dce3',
              bgcolor: '#fafafa',
              boxShadow: '10px 0 28px -24px rgba(30,30,44,0.55)',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(246, 246, 247, 0.94)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid #e5e2df',
            color: 'text.primary',
          }}
        >
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              minHeight: { xs: 92, sm: 76 },
              px: { xs: 1.5, sm: 2, md: 4 },
              py: { xs: 1.25, sm: 0 },
              gap: { xs: 1, sm: 2 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minWidth: 0, flex: '1 1 auto' }}>
              {isMobile && !hideSidebar && (
                <IconButton onClick={handleDrawerToggle} edge="start" sx={{ mr: { xs: 0, sm: 1 } }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 800, display: 'block' }}>
                  Task Management System
                </Typography>
                <Typography
                  variant="h6"
                  noWrap
                  sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  {title || 'Dashboard'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flex: { xs: '1 0 100%', sm: '0 0 auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' }, minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  px: { xs: 1.25, sm: 1.75 },
                  py: 0.9,
                  border: '1px solid #c9ece8',
                  borderRadius: 2,
                  bgcolor: '#e8f7f6',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 42,
                  minWidth: 0,
                  flex: { xs: '1 1 auto', sm: '0 1 auto' }
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ color: '#1f7f79', fontWeight: 800, maxWidth: { xs: '100%', sm: 240 } }}
                >
                  Logged in: {loginLabel}
                </Typography>
              </Paper>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitToAppRounded />}
                onClick={handleLogoutClick}
                sx={{
                  flexShrink: 0,
                  minHeight: 42,
                  px: { xs: 1.5, sm: 2.25 },
                  bgcolor: 'white',
                  borderColor: '#d90429',
                  color: '#d90429',
                  fontWeight: 900,
                  '&:hover': {
                    bgcolor: '#fff1f2',
                    borderColor: '#a80f24',
                    color: '#a80f24'
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Dialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: '16px' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, textAlign: 'center' }}>Logout</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" align="center">
              Are you sure you want to log out?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button
              onClick={handleLogout}
              variant="outlined"
              color="inherit"
              fullWidth
              sx={{ fontWeight: 900, minHeight: 48 }}
            >
              Logout
            </Button>
            <Button
              onClick={() => setLogoutDialogOpen(false)}
              variant="contained"
              color="error"
              fullWidth
              sx={{ fontWeight: 900, minHeight: 48 }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 1.5, sm: 2, md: 4 },
            py: { xs: 2, md: 3.5 },
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;

