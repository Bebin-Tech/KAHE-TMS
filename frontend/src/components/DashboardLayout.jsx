import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  Divider, IconButton, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  DashboardRounded,
  AssignmentRounded,
  PeopleRounded,
  SettingsRounded,
  ExitToAppRounded,
  NotificationsNoneRounded,
  ExpandMoreRounded,
  ChevronLeftRounded,
  AssessmentRounded
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;

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
    { text: 'Dashboard', icon: <DashboardRounded />, path: `/${user.role?.toLowerCase()}-dashboard` },
    ...(user.role === 'ADMIN' ? [{ text: 'User Management', icon: <PeopleRounded />, path: '/user-management' }] : []),
    { text: 'Tasks', icon: <AssignmentRounded />, path: '/tasks' },
    { text: 'Reports', icon: <AssessmentRounded />, path: '/reports' },
    { text: 'Settings', icon: <SettingsRounded />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: 'white' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, flexDirection: 'column' }}>
        <Box
          component="img"
          src="/logo.png"
          alt="KAHE Logo"
          sx={{
            width: '100%',
            maxWidth: '220px',
            height: 'auto',
            mb: 1,
            objectFit: 'contain'
          }}
        />
        <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#38bdf8', letterSpacing: '1px', fontSize: '1.1rem' }}>
          KAHE TMS
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '12px',
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'rgba(255,255,255,0.05)',
                    color: 'white'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  minWidth: '40px'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '16px', m: 2 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, mb: 1, display: 'block' }}>
          LOGGED IN AS
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', mr: 1.5, fontSize: '0.8rem' }}>
            {user.username?.[0].toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{user.full_name || user.username}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{user.role}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { md: `${open ? drawerWidth : 0}px` },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              {open ? <ChevronLeftRounded /> : <MenuIcon />}
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
              {title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton size="large" color="inherit">
                <NotificationsNoneRounded />
              </IconButton>
            </Tooltip>

            <Box
              onClick={handleMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: 0.5,
                pr: 1.5,
                borderRadius: '50px',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              <Avatar sx={{ width: 35, height: 35, bgcolor: 'primary.main', fontWeight: 700 }}>
                {user.username?.[0].toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" sx={{ lineHeight: 1, fontWeight: 700 }}>
                  {user.username}
                </Typography>
              </Box>
              <ExpandMoreRounded sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  borderRadius: '12px',
                  width: 200,
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
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

      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={handleDrawerToggle}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: '100%',
          mt: '64px',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && !isMobile && {
            ml: `${drawerWidth}px`,
            width: `calc(100% - ${drawerWidth}px)`,
          })
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
