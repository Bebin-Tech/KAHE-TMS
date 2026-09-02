import React, { useEffect, useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  IconButton, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar,
  useTheme, useMediaQuery, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Collapse, Tooltip
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
import NoteReminder from './NoteReminder';

const drawerExpandedWidth = 292;
const drawerCollapsedWidth = 76;
const permissionCachePrefix = 'tms_module_permissions';
let sidebarHoverActive = false;

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(sidebarHoverActive);
  const [homeOpen, setHomeOpen] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentSession = getCurrentSession();
  const user = currentSession?.session?.user || {};
  const userId = user.id;
  const userRole = user.role;
  const [modulePermissions, setModulePermissions] = useState(() => readCachedPermissions(user));

  const isExpanded = isMobile ? true : isHovered;

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

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const handleSidebarMouseEnter = () => {
    if (isMobile) return;
    sidebarHoverActive = true;
    setIsHovered(true);
  };
  const handleSidebarMouseLeave = () => {
    if (isMobile) return;
    sidebarHoverActive = false;
    setIsHovered(false);
  };
  const handleHomeToggle = () => setHomeOpen((current) => !current);
  const handleNavigate = (path) => {
    if (user.role) {
      setActiveRole(user.role);
      setRouteRole(path, user.role);
    }
    navigate(path);
    if (isMobile) setMobileOpen(false);
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
    if (user.role === 'ADMIN') return true;
    if (modulePermissions.length === 0) return true;
    const permission = modulePermissions.find((row) => row.module === item.module);
    return !permission || permission.can_access;
  });

  const roleLabel = user.role ? user.role.replace('_', ' ') : 'Member';
  const loginLabel = user.full_name || roleLabel;
  const isHomeActive = menuItems.some((item) => location.pathname === item.path);

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        color: '#0f172a',
        px: isExpanded ? { xs: 1.5, sm: 2 } : 1,
        transition: 'padding 240ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}
    >
      <Box
        sx={{
          py: { xs: 2.25, sm: 2.75 },
          px: isExpanded ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          gap: 1.4,
          minHeight: 74,
          transition: 'padding 240ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Box
          sx={{
            bgcolor: '#f8fafc',
            p: 0.55,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 44, sm: 48 },
            height: { xs: 44, sm: 48 },
            minWidth: { xs: 44, sm: 48 },
            border: '1px solid #e2e8f0',
            boxShadow: '0 16px 34px -26px rgba(15,23,42,0.35)',
            flexShrink: 0
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
        {isExpanded && (
          <Box sx={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: 0, lineHeight: 1.05 }}>
              KAHE TMS
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block', color: '#64748b', fontWeight: 680 }}>
              Task Management
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ px: isExpanded ? 0.5 : 0, mb: { xs: 2, sm: 2.5 }, transition: 'padding 240ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Paper elevation={0} sx={{
          p: isExpanded ? { xs: 1.35, sm: 1.6 } : 1,
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 34px -30px rgba(15,23,42,0.45)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          gap: isExpanded ? 1.5 : 0,
          color: '#0f172a',
          transition: 'all 240ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Avatar sx={{ width: 38, height: 38, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 800, flexShrink: 0 }}>
            {(user.username?.[0] || 'U').toUpperCase()}
          </Avatar>
          {isExpanded && (
            <Box sx={{ overflow: 'hidden', minWidth: 0, whiteSpace: 'nowrap' }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 760, color: '#0f172a' }}>
                {user.full_name || user.username || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 720 }}>
                {roleLabel}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <List sx={{ px: 0, mt: 0.5 }}>
        {modulePermissions === null && isExpanded && (
          <Typography variant="caption" sx={{ display: 'block', px: 1.5, py: 1, color: '#667085', fontWeight: 700 }}>
            Loading access...
          </Typography>
        )}
        {modulePermissions !== null && (
          <ListItem disablePadding sx={{ mb: 0.75 }}>
            <Tooltip title={!isExpanded ? "Home" : ""} placement="right" disableHoverListener={isExpanded} arrow>
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
                  transition: 'background-color 260ms ease, border-color 260ms ease, box-shadow 260ms ease, padding 240ms cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isHomeActive ? '0 14px 28px -24px rgba(37,99,235,0.7)' : 'none',
                  '&:hover': {
                    bgcolor: isHomeActive ? '#eff6ff' : '#f8fafc',
                    borderColor: isHomeActive ? 'rgba(37,99,235,0.35)' : '#dbe4ef',
                    boxShadow: '0 16px 34px -28px rgba(15,23,42,0.42)'
                  },
                  py: 1.25,
                  px: isExpanded ? 1.5 : 1,
                  justifyContent: isExpanded ? 'flex-start' : 'center'
                }}
              >
                <ListItemIcon sx={{
                  color: isHomeActive ? '#2563eb' : '#64748b',
                  minWidth: isExpanded ? '40px' : 'auto',
                  justifyContent: 'center',
                  '& svg': { fontSize: '1.35rem' }
                }}>
                  <HomeOutlined />
                </ListItemIcon>
                {isExpanded && (
                  <>
                    <ListItemText
                      primary="Home"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isHomeActive ? 760 : 680,
                        whiteSpace: 'nowrap'
                      }}
                    />
                    {homeOpen ? <ExpandLessRounded sx={{ color: '#64748b' }} /> : <ExpandMoreRounded sx={{ color: '#64748b' }} />}
                  </>
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        )}
        <Collapse in={homeOpen && modulePermissions !== null} timeout="auto" unmountOnExit>
          <List
            disablePadding
            sx={{
              pl: isExpanded ? 1.5 : 0,
              ml: isExpanded ? 1 : 0,
              borderLeft: isExpanded ? '1px solid #e2e8f0' : 'none',
              transition: 'all 240ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.6 }}>
                  <Tooltip title={!isExpanded ? item.text : ""} placement="right" disableHoverListener={isExpanded} arrow>
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
                        transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, padding 240ms cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isActive ? '0 14px 28px -24px rgba(37,99,235,0.7)' : 'none',
                        '&:hover': {
                          bgcolor: isActive ? '#eff6ff' : '#f8fafc',
                          borderColor: isActive ? 'rgba(37,99,235,0.35)' : '#dbe4ef',
                          boxShadow: '0 16px 34px -28px rgba(15,23,42,0.42)'
                        },
                        py: 1.05,
                        px: isExpanded ? 1.25 : 1,
                        justifyContent: isExpanded ? 'flex-start' : 'center'
                      }}
                    >
                      <ListItemIcon sx={{
                        color: isActive ? '#2563eb' : '#64748b',
                        minWidth: isExpanded ? '38px' : 'auto',
                        justifyContent: 'center',
                        transition: 'color 180ms ease',
                        '& svg': { fontSize: '1.35rem' }
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {isExpanded && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.835rem',
                            fontWeight: isActive ? 760 : 680,
                            whiteSpace: 'nowrap'
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', bgcolor: 'background.default' }}>
      {!hideSidebar && (
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          PaperProps={{
            onMouseEnter: handleSidebarMouseEnter,
            onMouseLeave: handleSidebarMouseLeave,
          }}
          sx={{
            width: {
              xs: 'min(86vw, 292px)',
              md: isHovered ? drawerExpandedWidth : drawerCollapsedWidth,
            },
            flexShrink: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isMobile ? 'min(86vw, 292px)' : (isHovered ? drawerExpandedWidth : drawerCollapsedWidth),
              borderRight: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: isHovered
                ? '0 20px 40px -15px rgba(15, 23, 42, 0.18), 10px 0 30px -20px rgba(15,23,42,0.35)'
                : '4px 0 20px -15px rgba(15,23,42,0.1)',
              transition: theme.transitions.create(['width', 'box-shadow'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
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
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
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
                  sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '0.98rem', sm: '1.25rem' }, maxWidth: { xs: '64vw', sm: 'none' } }}
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

        {/* Minimalist Logout Confirmation Modal */}
        <Dialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: 380,
              borderRadius: '20px',
              p: { xs: 2.5, sm: 3 },
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.6)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                bgcolor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <LogoutRounded sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', mb: 0.5 }}>
              Logout
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 0, py: 0.5, pb: 3 }}>
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', fontWeight: 500, lineHeight: 1.5 }}>
              Are you sure you want to log out?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 0, gap: 1.5 }}>
            <Button
              onClick={() => setLogoutDialogOpen(false)}
              variant="outlined"
              fullWidth
              sx={{
                minHeight: 44,
                borderRadius: '12px',
                borderColor: '#e2e8f0',
                color: '#475569',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.925rem',
                bgcolor: '#ffffff',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  borderColor: '#cbd5e1',
                  color: '#1e293b'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              variant="contained"
              disableElevation
              fullWidth
              sx={{
                minHeight: 44,
                borderRadius: '12px',
                bgcolor: '#ef4444',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.925rem',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                '&:hover': {
                  bgcolor: '#dc2626',
                  boxShadow: '0 6px 16px rgba(220, 38, 38, 0.35)'
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
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
          }}
        >
          {children}
        </Box>
        {!hideSidebar && <NoteReminder />}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
