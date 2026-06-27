import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  IconButton, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar,
  useTheme, useMediaQuery, Paper, Menu, MenuItem, Divider,
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
  AssignmentTurnedInOutlined,
  KeyboardArrowDownRounded
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 292;

const DashboardLayout = ({ children, title, hideSidebar = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [pressedPath, setPressedPath] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleDrawerToggle = () => setOpen(!open);
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleNavigate = (path) => {
    setPressedPath(path);
    navigate(path);
    if (isMobile) setOpen(false);
    window.setTimeout(() => setPressedPath(''), 160);
  };
  const handleLogoutClick = () => {
    handleClose();
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#101828', color: 'white', px: 2.25 }}>
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
            border: '1px solid rgba(255,255,255,0.72)',
            boxShadow: '0 18px 38px -18px rgba(255,255,255,0.72)'
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
          <Typography variant="h6" component="div" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: 0, lineHeight: 1.1 }}>
            KAHE TMS
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 0.5, mb: 3 }}>
        <Paper elevation={0} sx={{
          p: 2,
          bgcolor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: 'white'
        }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#3f8ed6', fontWeight: 800 }}>
            {(user.username?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: 'white' }}>
              {user.full_name || user.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#c9d4e5', fontWeight: 700 }}>
              {roleLabel}
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Typography variant="caption" sx={{ px: 1.5, mb: 1.25, color: '#98a2b3', fontWeight: 900, letterSpacing: '0.08em' }}>
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
                  bgcolor: isActive ? 'rgba(63, 142, 214, 0.16)' : 'transparent',
                  color: isActive ? '#ffffff' : '#c9d4e5',
                  border: isActive ? '1px solid rgba(63, 142, 214, 0.35)' : '1px solid transparent',
                  transform: isPressed ? 'scale(0.975)' : 'scale(1)',
                  transition: 'transform 140ms ease, background-color 220ms ease, border-color 220ms ease, color 220ms ease, box-shadow 220ms ease',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(124, 196, 255, 0.08)' : 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: 4,
                    height: isActive ? 28 : 0,
                    borderRadius: '0 999px 999px 0',
                    bgcolor: '#7cc4ff',
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
                    bgcolor: 'rgba(255,255,255,0.08)',
                    transform: isPressed ? 'scale(0.975)' : 'translateX(4px)',
                    borderColor: 'rgba(255,255,255,0.1)'
                  },
                  '&:active': {
                    transform: 'scale(0.975)'
                  },
                  py: 1.35
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? '#7cc4ff' : '#98a2b3',
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
              borderRight: 'none',
              bgcolor: '#101828',
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
            bgcolor: 'rgba(248, 250, 253, 0.92)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid #dde5f0',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 76, px: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
              {isMobile && !hideSidebar && (
                <IconButton onClick={handleDrawerToggle} edge="start" sx={{ mr: 1 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                  Task Management System
                </Typography>
                <Typography variant="h6" noWrap sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.2 }}>
                  {title || 'Dashboard'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  px: { xs: 1.25, sm: 1.75 },
                  py: 0.9,
                  border: '1px solid #dde5f0',
                  borderRadius: 2,
                  bgcolor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 42
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ color: '#047857', fontWeight: 800, maxWidth: { xs: 130, sm: 240 } }}
                >
                  Logged in: {loginLabel}
                </Typography>
              </Paper>
              <Box
                onClick={handleMenu}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  bgcolor: 'white',
                  border: '1px solid #dde5f0',
                  borderRadius: 2,
                  p: 0.5,
                  pl: 0.75
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontWeight: 800 }}>
                  {(user.username?.[0] || 'U').toUpperCase()}
                </Avatar>
                <KeyboardArrowDownRounded sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                    mt: 1.5,
                    borderRadius: '10px',
                    width: 200,
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>Profile</MenuItem>
                <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>Account Settings</MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem
                  onClick={handleLogoutClick}
                  disableRipple
                  sx={{
                    mx: 1.5,
                    my: 1.5,
                    py: 1.25,
                    px: 2,
                    minHeight: 52,
                    borderRadius: '14px',
                    color: 'white',
                    bgcolor: '#d90429',
                    border: '2px solid #a80f24',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.28), 0 8px 18px rgba(217,4,41,0.28)',
                    fontWeight: 900,
                    fontSize: '1rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    justifyContent: 'center',
                    gap: 1.25,
                    transition: 'transform 140ms ease, background-color 180ms ease, box-shadow 180ms ease',
                    '&:hover': {
                      bgcolor: '#ef233c',
                      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.34), 0 10px 20px rgba(217,4,41,0.34)'
                    },
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, color: 'white' }}>
                    <ExitToAppRounded sx={{ color: 'white', fontSize: 30 }} />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
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
          <DialogTitle sx={{ fontWeight: 900 }}>Confirm Logout</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to log out?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setLogoutDialogOpen(false)} color="inherit" sx={{ fontWeight: 800 }}>
              Cancel
            </Button>
            <Button onClick={handleLogout} variant="contained" color="error" sx={{ fontWeight: 800 }}>
              Logout
            </Button>
          </DialogActions>
        </Dialog>

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 4 },
            py: { xs: 2.5, md: 3.5 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
