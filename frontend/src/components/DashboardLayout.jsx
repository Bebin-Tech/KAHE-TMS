import React, { useEffect, useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  IconButton, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar,
  useTheme, useMediaQuery, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Collapse
} from '@mui/material';
import {
  DashboardOutlined,
  PeopleOutlined,
  AssignmentOutlined,
  AssessmentOutlined,
  NotesOutlined,
  SettingsOutlined,
  BusinessOutlined,
  Menu as MenuIcon,
  ExitToAppRounded,
  AssignmentTurnedInOutlined,
  HomeOutlined,
  ExpandLessRounded,
  ExpandMoreRounded,
  LogoutRounded
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearRoleSession, getCurrentSession, setActiveRole, setRouteRole } from '../utils/session';
import api from '../api/axios';

const drawerWidth = 292;
const permissionCachePrefix = 'tms_module_permissions';

const getPermissionCacheKey = (user) => (
  user?.id && user?.role ? `${permissionCachePrefix}:${user.id}:${user.role}` : ''
);

const readCachedPermissions = (user) => {
  const key = getPermissionCacheKey(user);
  if (!key) return null;

  try {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    return null;
  }
};

const writeCachedPermissions = (user, permissions) => {
  const key = getPermissionCacheKey(user);
  if (!key) return;
  sessionStorage.setItem(key, JSON.stringify(permissions));
};

const DashboardLayout = ({ children, title, hideSidebar = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [homeOpen, setHomeOpen] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentSession = getCurrentSession();
  const user = currentSession?.session?.user || {};
  const userId = user.id;
  const userRole = user.role;
  const [modulePermissions, setModulePermissions] = useState(() => readCachedPermissions(user));

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    let isMounted = true;

    const fetchModulePermissions = async () => {
      if (!userId) return;

      const cacheUser = { id: userId, role: userRole };
      const cachedPermissions = readCachedPermissions(cacheUser);
      if (cachedPermissions) setModulePermissions(cachedPermissions);

      try {
        const response = await api.get('user-module-permissions/mine/');
        const permissions = response.data || [];
        writeCachedPermissions(cacheUser, permissions);
        if (isMounted) setModulePermissions(permissions);
      } catch (err) {
        if (isMounted) setModulePermissions([]);
      }
    };

    fetchModulePermissions();
    return () => {
      isMounted = false;
    };
  }, [userId, userRole]);

  const handleDrawerToggle = () => setOpen(!open);
  const handleHomeToggle = () => setHomeOpen((current) => !current);
  const handleNavigate = (path) => {
    if (user.role) {
      setActiveRole(user.role);
      setRouteRole(path, user.role);
    }
    navigate(path);
    if (isMobile) setOpen(false);
  };
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };
  const handleLogout = () => {
    clearRoleSession(user.role || currentSession?.role);
    navigate('/login');
  };

  const baseMenuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: `/${user.role?.toLowerCase()}-dashboard`, module: 'dashboard' },
    ...(user.role === 'ADMIN' ? [
      { text: 'Department', icon: <BusinessOutlined />, path: '/department-management', module: 'department_management' }
    ] : []),
    { text: 'Task', icon: <AssignmentOutlined />, path: '/tasks', module: 'tasks' },
    { text: 'Completed Task', icon: <AssignmentTurnedInOutlined />, path: '/completed-tasks', module: 'completed_tasks' },
    { text: 'Report', icon: <AssessmentOutlined />, path: '/reports', module: 'reports' },
    { text: 'Notes', icon: <NotesOutlined />, path: user.role === 'ADMIN' ? '/admin-notes' : '/notes', module: 'notes' },
    ...(user.role === 'ADMIN' ? [
      { text: 'User', icon: <PeopleOutlined />, path: '/user-management', module: 'user_management' }
    ] : []),
    { text: 'Settings', icon: <SettingsOutlined />, path: '/settings', module: 'settings' },
  ];

  const menuItems = modulePermissions === null ? [] : baseMenuItems.filter((item) => {
    if (modulePermissions.length === 0) return true;
    const permission = modulePermissions.find((row) => row.module === item.module);
    return !permission || permission.can_access;
  });

  const roleLabel = user.role ? user.role.replace('_', ' ') : 'Member';
  const loginLabel = user.full_name || roleLabel;
  const isHomeActive = menuItems.some((item) => location.pathname === item.path);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', color: '#0f172a', px: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ py: { xs: 2.25, sm: 3 }, px: 1, display: 'flex', alignItems: 'center', gap: 1.4 }}>
        <Box
          sx={{
            bgcolor: '#f8fafc',
            p: 0.55,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 44, sm: 50 },
            height: { xs: 44, sm: 50 },
            border: '1px solid #e2e8f0',
            boxShadow: '0 16px 34px -26px rgba(15,23,42,0.35)'
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
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: 0, lineHeight: 1.05 }}>
            KAHE TMS
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: '#64748b', fontWeight: 680 }}>
            Task Management
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 0.5, mb: { xs: 2, sm: 3 } }}>
        <Paper elevation={0} sx={{
          p: { xs: 1.35, sm: 1.75 },
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 34px -30px rgba(15,23,42,0.45)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: '#0f172a'
        }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 800 }}>
            {(user.username?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 760, color: '#0f172a' }}>
              {user.full_name || user.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 720 }}>
              {roleLabel}
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Typography variant="caption" sx={{ px: 1.5, mb: 1.25, color: '#64748b', fontWeight: 800, letterSpacing: '0.08em' }}>
        WORKSPACE
      </Typography>
      <List sx={{ px: 0 }}>
        {modulePermissions === null && (
          <Typography variant="caption" sx={{ display: 'block', px: 1.5, py: 1, color: '#667085', fontWeight: 700 }}>
            Loading access...
          </Typography>
        )}
        {modulePermissions !== null && (
          <ListItem disablePadding sx={{ mb: 0.75 }}>
            <ListItemButton
              disableRipple
              onClick={handleHomeToggle}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2,
                bgcolor: isHomeActive ? '#eff6ff' : 'transparent',
                color: '#0f172a',
                border: isHomeActive ? '1px solid rgba(37,99,235,0.22)' : '1px solid transparent',
                transition: 'background-color 260ms ease, border-color 260ms ease, box-shadow 260ms ease',
                boxShadow: isHomeActive ? '0 14px 28px -24px rgba(37,99,235,0.7)' : 'none',
                '&:hover': {
                  bgcolor: isHomeActive ? '#eff6ff' : '#f8fafc',
                  borderColor: isHomeActive ? 'rgba(37,99,235,0.35)' : '#dbe4ef',
                  boxShadow: '0 16px 34px -28px rgba(15,23,42,0.42)'
                },
                py: 1.25
              }}
            >
              <ListItemIcon sx={{
                color: isHomeActive ? '#2563eb' : '#64748b',
                minWidth: '42px',
                '& svg': { fontSize: '1.35rem' }
              }}>
                <HomeOutlined />
              </ListItemIcon>
              <ListItemText
                primary="Home"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isHomeActive ? 760 : 680,
                }}
              />
              {homeOpen ? <ExpandLessRounded sx={{ color: '#64748b' }} /> : <ExpandMoreRounded sx={{ color: '#64748b' }} />}
            </ListItemButton>
          </ListItem>
        )}
        <Collapse in={homeOpen && modulePermissions !== null} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 1.5, ml: 1, borderLeft: '1px solid #e2e8f0' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.6 }}>
              <ListItemButton
                disableRipple
                onClick={() => handleNavigate(item.path)}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 2,
                  bgcolor: isActive ? '#eff6ff' : 'transparent',
                  color: '#0f172a',
                  border: isActive ? '1px solid rgba(37,99,235,0.22)' : '1px solid transparent',
                  transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
                  boxShadow: isActive ? '0 14px 28px -24px rgba(37,99,235,0.7)' : 'none',
                  '&:hover': {
                    bgcolor: isActive ? '#eff6ff' : '#f8fafc',
                    borderColor: isActive ? 'rgba(37,99,235,0.35)' : '#dbe4ef',
                    boxShadow: '0 16px 34px -28px rgba(15,23,42,0.42)'
                  },
                  py: 1.05,
                  pl: 1.25
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? '#2563eb' : '#64748b',
                  minWidth: '38px',
                  transition: 'color 180ms ease',
                  '& svg': { fontSize: '1.35rem' }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.835rem',
                    fontWeight: isActive ? 760 : 680,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
          </List>
        </Collapse>
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
            width: { xs: 'min(86vw, 292px)', md: drawerWidth },
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: { xs: 'min(86vw, 292px)', md: drawerWidth },
              borderRight: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '10px 0 30px -28px rgba(15,23,42,0.45)',
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
            bgcolor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid #e2e8f0',
            color: 'text.primary',
            boxShadow: '0 14px 34px -32px rgba(15,23,42,0.42)'
          }}
        >
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: { xs: 64, sm: 76 },
              px: { xs: 1.25, sm: 2, md: 4 },
              py: { xs: 0.85, sm: 0 },
              gap: { xs: 1, sm: 2 },
              flexWrap: 'nowrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 2 }, minWidth: 0, flex: '1 1 auto' }}>
              {isMobile && !hideSidebar && (
                <IconButton onClick={handleDrawerToggle} edge="start" sx={{ mr: { xs: 0, sm: 1 }, width: 42, height: 42 }}>
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
                  sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '0.98rem', sm: '1.25rem' }, maxWidth: { xs: '48vw', sm: 'none' } }}
                >
                  {title || 'Dashboard'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 2 }, flex: '0 0 auto', justifyContent: 'flex-end', minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  px: { xs: 1.25, sm: 1.75 },
                  py: 0.9,
                  border: '1px solid #ccfbf1',
                  borderRadius: 2,
                  bgcolor: '#f0fdfa',
                  alignItems: 'center',
                  minHeight: 42,
                  minWidth: 0,
                  flex: '0 1 auto',
                  display: { xs: 'none', sm: 'flex' }
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ color: '#0f766e', fontWeight: 760, maxWidth: { xs: '100%', sm: 240 } }}
                >
                  Logged in: {loginLabel}
                </Typography>
              </Paper>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitToAppRounded />}
                onClick={handleLogoutClick}
                aria-label="Logout"
                sx={{
                  flexShrink: 0,
                  minHeight: 42,
                  px: { xs: 1.15, sm: 2.25 },
                  minWidth: { xs: 42, sm: 92 },
                  bgcolor: 'white',
                  borderColor: '#d90429',
                  color: '#d90429',
                  fontWeight: 900,
                  '&:hover': {
                    bgcolor: '#fff1f2',
                    borderColor: '#a80f24',
                    color: '#a80f24'
                  },
                  '& .MuiButton-startIcon': {
                    mr: { xs: 0, sm: 1 },
                    ml: 0
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Logout</Box>
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Dialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: 360,
              borderRadius: 3,
              p: { xs: 2, sm: 2.5 },
              boxShadow: '0 26px 70px -42px rgba(15,23,42,0.45)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center' }}>
            <Box
              sx={{
                width: 82,
                height: 82,
                mx: 'auto',
                mb: 2.25,
                borderRadius: '50%',
                bgcolor: '#fff1f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LogoutRounded sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#111827' }}>
              Logout
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 0, pt: 1, pb: 2.5 }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ fontWeight: 650 }}>
              Are you sure you want to log out?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 0, gap: 1.5 }}>
            <Button
              onClick={() => setLogoutDialogOpen(false)}
              variant="contained"
              fullWidth
              sx={{
                minHeight: 48,
                bgcolor: '#f7f7f8',
                background: '#f7f7f8',
                color: '#4b4f58',
                fontWeight: 900,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#eeeeef',
                  background: '#eeeeef',
                  boxShadow: 'none'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              variant="contained"
              fullWidth
              sx={{
                minHeight: 48,
                bgcolor: '#e9353d',
                background: '#e9353d',
                color: '#ffffff',
                fontWeight: 900,
                boxShadow: '0 12px 24px -18px rgba(233,53,61,0.85)',
                '&:hover': {
                  bgcolor: '#d92f36',
                  background: '#d92f36',
                  boxShadow: '0 14px 28px -20px rgba(217,47,54,0.9)'
                }
              }}
            >
              Logout
            </Button>
          </DialogActions>
        </Dialog>

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 1, sm: 2, md: 4 },
            pt: { xs: 1.5, sm: 2, md: 3.5 },
            pb: { xs: 4, md: 6 },
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

