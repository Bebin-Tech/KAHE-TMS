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
import { clearRoleSession, getCurrentSession } from '../utils/session';

const drawerWidth = 292;

const DashboardLayout = ({ children, title, hideSidebar = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [pressedPath, setPressedPath] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const currentSession = getCurrentSession();
  const user = currentSession?.session?.user || {};

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => setOpen(!open);
  const handleNavigate = (path) => {
    setPressedPath(path);
    navigate(path);
    if (isMobile) setOpen(false);
    window.setTimeout(() => setPressedPath(''), 360);
  };
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };
  const handleLogout = () => {
    clearRoleSession(user.role || currentSession?.role);
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa', color: '#1E1E2C', px: 2 }}>
      <Box sx={{ py: 3, px: 1, display: 'flex', alignItems: 'center', gap: 1.4 }}>
        <Box
          sx={{
            bgcolor: 'white',
            p: 0.55,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 50,
            height: 50,
            border: '1px solid #e5e2df',
            boxShadow: '0 18px 38px -24px rgba(30,30,44,0.34)'
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
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 950, color: '#1E1E2C', letterSpacing: 0, lineHeight: 1.05 }}>
            KAHE TMS
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: '#667085', fontWeight: 700 }}>
            Task Management
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 0.5, mb: 3 }}>
        <Paper elevation={0} sx={{
          p: 1.75,
          bgcolor: '#ffffff',
          border: '1px solid #e5e2df',
          boxShadow: '0 16px 38px -30px rgba(30,30,44,0.45)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: '#1E1E2C'
        }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#eaf3ff', color: '#237dba', fontWeight: 950 }}>
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

      <Typography variant="caption" sx={{ px: 1.5, mb: 1.25, color: '#667085', fontWeight: 950, letterSpacing: '0.08em' }}>
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
                  borderRadius: '12px',
                  bgcolor: isActive ? '#eaf3ff' : 'transparent',
                  color: '#1E1E2C',
                  border: isActive ? '1px solid rgba(59,143,243,0.36)' : '1px solid transparent',
                  transform: isPressed ? 'translateX(5px) scale(0.985)' : 'translateX(0) scale(1)',
                  transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), background-color 260ms ease, border-color 260ms ease, color 260ms ease, box-shadow 260ms ease',
                  boxShadow: isActive ? '0 16px 34px -24px rgba(35,125,186,0.72)' : 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: isActive ? 4 : 0,
                    height: isActive ? 28 : 0,
                    borderRadius: '0 999px 999px 0',
                    bgcolor: '#3B8FF3',
                    transform: 'translateY(-50%)',
                    opacity: isActive ? 1 : 0,
                    transition: 'width 260ms ease, height 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, rgba(59,143,243,0), rgba(59,143,243,0.16), rgba(52,177,170,0.08), rgba(59,143,243,0))',
                    transform: isPressed ? 'translateX(115%)' : 'translateX(-115%)',
                    opacity: isPressed ? 1 : 0,
                    transition: 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease',
                    pointerEvents: 'none'
                  },
                  '&:hover': {
                    bgcolor: isActive ? '#eaf3ff' : '#ffffff',
                    transform: isPressed ? 'translateX(5px) scale(0.985)' : 'translateX(4px)',
                    borderColor: isActive ? 'rgba(59,143,243,0.44)' : '#dfe5ec',
                    boxShadow: '0 16px 34px -26px rgba(30,30,44,0.44)'
                  },
                  '&:active': {
                    transform: 'translateX(5px) scale(0.985)'
                  },
                  py: 1.25
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? '#237dba' : '#5f756f',
                  minWidth: '42px',
                  transition: 'color 260ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: isPressed ? 'translateX(3px) scale(1.12)' : isActive ? 'scale(1.07)' : 'scale(1)',
                  '& svg': { fontSize: '1.35rem' }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 900 : 700,
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
            bgcolor: 'rgba(250, 250, 250, 0.94)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid #e5e2df',
            color: 'text.primary',
            boxShadow: '0 14px 34px -32px rgba(30,30,44,0.5)'
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
                <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 850, display: 'block' }}>
                  Task Management System
                </Typography>
                <Typography
                  variant="h6"
                  noWrap
                  sx={{ fontWeight: 950, color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
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

