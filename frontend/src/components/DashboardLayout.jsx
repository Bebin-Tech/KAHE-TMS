import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  IconButton, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Badge,
  useTheme, useMediaQuery, Paper, Menu, MenuItem, Divider
} from '@mui/material';
import {
  DashboardOutlined,
  PeopleOutlined,
  AssignmentOutlined,
  AssessmentOutlined,
  SettingsOutlined,
  FactCheckOutlined,
  BusinessOutlined,
  Search,
  Notifications,
  Menu as MenuIcon,
  ExitToAppRounded,
  AssignmentTurnedInOutlined
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const DashboardLayout = ({ children, title }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleDrawerToggle = () => setOpen(!open);
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: `/${user.role?.toLowerCase()}-dashboard` },
    ...(user.role === 'ADMIN' ? [
      { text: 'User', icon: <PeopleOutlined />, path: '/user-management' },
      { text: 'Department', icon: <BusinessOutlined />, path: '/department-management' }
    ] : []),
    { text: 'Task', icon: <AssignmentOutlined />, path: '/tasks' },
    { text: 'Completed Tasks', icon: <AssignmentTurnedInOutlined />, path: '/completed-tasks' },
    { text: 'Reports', icon: <AssessmentOutlined />, path: '/reports' },
    { text: 'Settings', icon: <SettingsOutlined />, path: '/settings' },
    { text: 'Complete Module', icon: <FactCheckOutlined />, path: '/complete-module' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white', px: 2 }}>
      {/* Restored Previous Logo */}
      <Box sx={{ py: 3, px: 2, display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            bgcolor: 'white',
            p: 0.4,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            mr: 1.2,
            boxShadow: '0 2px 4px -1px rgba(0,0,0,0.1)'
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
        <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px', fontSize: '0.95rem' }}>
          KAHE TMS
        </Typography>
      </Box>

      {/* User Card */}
      <Box sx={{ px: 1, mb: 4 }}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f4f6f8', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
            {(user.username?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: '#212b36' }}>
              {user.full_name || user.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#637381' }}>
              {user.role}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Menu List */}
      <List sx={{ px: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  bgcolor: isActive ? 'rgba(145, 158, 171, 0.08)' : 'transparent',
                  color: isActive ? '#212b36' : '#637381',
                  '&:hover': {
                    bgcolor: 'rgba(145, 158, 171, 0.04)',
                  },
                  py: 1.5
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? '#1976d2' : '#637381',
                  minWidth: '44px',
                  '& svg': { fontSize: '1.4rem' }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#eaefec' }}>
      {/* Sidebar */}
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
            borderRight: '1px dashed rgba(145, 158, 171, 0.24)',
            bgcolor: 'white',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(234, 239, 236, 0.8)', // Matches #eaefec with transparency
            backdropFilter: 'blur(6px)',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isMobile && (
                <IconButton onClick={handleDrawerToggle} edge="start" sx={{ mr: 1 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <IconButton size="small" sx={{ color: '#637381' }}>
                <Search />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size="small" sx={{ color: '#637381' }}>
                <Badge badgeContent={2} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <Avatar
                onClick={handleMenu}
                sx={{ width: 32, height: 32, cursor: 'pointer', border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0', bgcolor: 'primary.main' }}
              >
                {(user.username?.[0] || 'U').toUpperCase()}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                    mt: 1.5,
                    borderRadius: '12px',
                    width: 200,
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>Profile</MenuItem>
                <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>Account Settings</MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                  <ListItemIcon>
                    <ExitToAppRounded fontSize="small" sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 5 },
            py: 4,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
