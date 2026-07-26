import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Typography, Box, Button, Grid,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Switch, FormControlLabel,
  Card, Avatar, Divider, Tooltip, Pagination, PaginationItem,
  Snackbar, Alert
} from '@mui/material';
import {
  EditRounded,
  LockResetRounded,
  DeleteRounded,
  PersonAddRounded,
  EmailOutlined,
  BusinessOutlined,
  BadgeOutlined,
  SearchRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    role: 'FACULTY', department: '', password: ''
  });

  const pageOptions = [
    { label: 'Department', role: null },
    { label: 'Dean', role: 'DEAN' },
    { label: 'Admin', role: 'ADMIN' },
  ];
  const currentPage = pageOptions[page - 1] || pageOptions[0];

  const showMessage = (message, severity = 'success') => {
    setNotification({ open: true, severity, message });
  };

  const fetchData = async () => {
    try {
      const [userRes, deptRes] = await Promise.all([
        api.get('users/'),
        api.get('departments/')
      ]);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const userMatchesSearch = (user) => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return true;

    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.department_name?.toLowerCase().includes(searchLower)
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = currentPage.role ? user.role === currentPage.role : ['HOD', 'FACULTY'].includes(user.role);
    return matchesRole && userMatchesSearch(user);
  });

  const departmentGroups = departments
    .map((department) => {
      const members = filteredUsers.filter((user) => user.department === department.id);
      return {
        id: department.id,
        name: department.name,
        blockName: department.block_name,
        hods: members.filter((user) => user.role === 'HOD'),
        faculty: members.filter((user) => user.role === 'FACULTY'),
      };
    })
    .filter((group) => group.hods.length > 0 || group.faculty.length > 0);

  const unassignedMembers = filteredUsers.filter((user) => !user.department);
  if (unassignedMembers.length > 0) {
    departmentGroups.push({
      id: 'unassigned',
      name: 'No Department Assigned',
      blockName: '',
      hods: unassignedMembers.filter((user) => user.role === 'HOD'),
      faculty: unassignedMembers.filter((user) => user.role === 'FACULTY'),
    });
  }

  const handleOpen = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username, email: user.email,
        first_name: user.first_name, last_name: user.last_name,
        role: user.role, department: user.department || '', password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '', email: '', first_name: '', last_name: '',
        role: 'FACULTY', department: '', password: ''
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prepare data: convert empty department string to null
    const submitData = { ...formData };
    if (submitData.department === '') {
      submitData.department = null;
    }

    try {
      if (editingUser) {
        await api.patch(`users/${editingUser.id}/`, submitData);
      } else {
        await api.post('users/create_user/', submitData);
      }
      setOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
      if (err.response?.status === 401) return;
      showMessage(formatApiError(err, 'Failed to save user account.'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`users/${deleteTarget.id}/`);
      setDeleteTarget(null);
      showMessage('User deleted successfully.');
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      showMessage(formatApiError(err, 'Failed to delete user.'), 'error');
    }
  };

  const openResetPasswordDialog = (id) => {
    setResetUserId(id);
    setNewPassword('');
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showMessage('Temporary password must be at least 6 characters.', 'error');
      return;
    }

    try {
      await api.post(`users/${resetUserId}/reset_password/`, { new_password: newPassword });
      setResetUserId(null);
      setNewPassword('');
      showMessage('Password reset successfully.');
    } catch (err) {
      showMessage(formatApiError(err, 'Failed to reset password.'), 'error');
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.post(`users/${id}/toggle_active/`);
      fetchData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return { bg: '#f1f5f9', color: '#0f172a' };
      case 'DEAN': return { bg: '#eaf3ff', color: '#237dba' };
      case 'HOD': return { bg: '#fff8d9', color: '#8a6f00' };
      case 'FACULTY': return { bg: '#e8f7f6', color: '#1f7f79' };
      default: return { bg: '#f4f6f8', color: '#637381' };
    }
  };

  const getUserName = (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

  const renderUserCard = (user) => {
    const roleStyle = getRoleColor(user.role);
    return (
      <Grid item xs={12} sm={6} md={currentPage.role ? 4 : 6} key={user.id}>
        <Card sx={{
          p: 3,
          minHeight: '100%',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 22px 48px -32px rgba(15, 32, 58, 0.65)' }
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{ width: 48, height: 48, bgcolor: roleStyle.color, fontWeight: 700 }}
            >
              {user.first_name?.[0]}{user.last_name?.[0]}
            </Avatar>
            <Chip
              label={user.role}
              size="small"
              sx={{ bgcolor: roleStyle.bg, color: roleStyle.color, fontWeight: 700, borderRadius: '6px' }}
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, color: '#212b36', mb: 0.5 }}>
            {getUserName(user)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#637381', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BadgeOutlined sx={{ fontSize: '1rem' }} /> @{user.username}
          </Typography>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmailOutlined sx={{ color: '#919eab', fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ color: '#212b36' }}>{user.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BusinessOutlined sx={{ color: '#919eab', fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ color: '#212b36' }}>{user.department_name || 'No Department'}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={user.is_active}
                  onChange={() => toggleActive(user.id)}
                  size="small"
                  color="primary"
                />
              }
              label={user.is_active ? "Active" : "Inactive"}
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 600, color: user.is_active ? '#047857' : '#b91c1c' } }}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Edit User">
                <IconButton onClick={() => handleOpen(user)} size="small" sx={{ color: '#237dba' }}>
                  <EditRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset Password">
                <IconButton onClick={() => openResetPasswordDialog(user.id)} size="small" sx={{ color: '#f59e0b' }}>
                  <LockResetRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton onClick={() => setDeleteTarget(user)} size="small" sx={{ color: '#f44336' }}>
                  <DeleteRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Card>
      </Grid>
    );
  };

  return (
    <DashboardLayout title="User Management">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'flex-end' }, gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', md: 'center' }, gap: 3, flexDirection: { xs: 'column', md: 'row' }, flex: 1 }}>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#212b36' }}>All users</Typography>
            <Typography variant="body2" color="text.secondary">
              Viewing <b>{currentPage.label}</b>{currentPage.role ? ' accounts.' : ' groups with HOD and Faculty members.'}
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#fff',
            borderRadius: '12px',
            px: 2,
            py: 1,
            width: { xs: '100%', md: '340px' },
            border: '1.5px solid #d1d5db',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:focus-within': {
              bgcolor: 'white',
              border: '1.5px solid #2563eb',
              boxShadow: '0 0 0 4px rgba(0, 102, 178, 0.1)'
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <SearchRounded sx={{ color: '#637381', mr: 1, fontSize: '1.2rem' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.875rem',
                color: '#212b36',
                fontWeight: 500
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row-reverse' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PersonAddRounded />}
            onClick={() => handleOpen()}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add New User
          </Button>

          <Pagination
            count={pageOptions.length}
            page={page}
            onChange={handlePageChange}
            renderItem={(item) => (
              <PaginationItem
                {...item}
                sx={{
                  bgcolor: item.selected ? 'primary.main' : 'white',
                  color: item.selected ? 'white' : 'text.primary',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  margin: '0 4px',
                      border: '1px solid #e5e2df',
                  '&:hover': {
                    bgcolor: item.selected ? 'primary.dark' : '#eaf3ff'
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    fontWeight: 800,
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  },
                  '& .MuiPaginationItem-icon': {
                    color: 'inherit'
                  }
                }}
              />
            )}
          />
        </Box>
      </Box>

      {currentPage.role ? (
        <Grid container spacing={3}>
          {filteredUsers.length > 0 ? filteredUsers.map(renderUserCard) : (
            <Grid item xs={12} sx={{ py: 10, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">No user accounts found.</Typography>
            </Grid>
          )}
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {departmentGroups.length > 0 ? departmentGroups.map((group) => (
            <Box
              key={group.id}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                bgcolor: '#ffffff',
                p: { xs: 2, md: 3 },
                boxShadow: '0 18px 44px -36px rgba(15, 32, 58, 0.55)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#212b36' }}>{group.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.blockName || 'Block not assigned'} | {group.hods.length} HOD | {group.faculty.length} Faculty
                  </Typography>
                </Box>
                <Chip
                  label={`${group.hods.length + group.faculty.length} members`}
                  sx={{ bgcolor: '#eaf3ff', color: '#237dba', fontWeight: 800, borderRadius: '8px' }}
                />
              </Box>

              <Box sx={{ mb: group.faculty.length ? 3 : 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#8a6f00', mb: 1.5 }}>HOD</Typography>
                <Grid container spacing={2.5}>
                  {group.hods.length > 0 ? group.hods.map(renderUserCard) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No HOD assigned to this department.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1f7f79', mb: 1.5 }}>Faculty</Typography>
                <Grid container spacing={2.5}>
                  {group.faculty.length > 0 ? group.faculty.map(renderUserCard) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No faculty assigned to this department.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          )) : (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">No HOD or Faculty accounts found.</Typography>
            </Box>
          )}
        </Box>
        )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>
            {editingUser ? 'Edit User Account' : 'Create New Account'}
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email Address" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Username" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </Grid>
              {!editingUser && (
                <Grid item xs={12}>
                  <TextField fullWidth label="Temporary Password" type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </Grid>
              )}
              <Grid item xs={6}>
                <TextField select fullWidth label="Assigned Role" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="DEAN">Dean</MenuItem>
                  <MenuItem value="HOD">HOD</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)} sx={{ color: '#637381', fontWeight: 700 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#2563eb', color: 'white', '&:hover': { bgcolor: '#1d4ed8' }, borderRadius: 1.5, px: 3, fontWeight: 720, textTransform: 'none' }}
            >
              {editingUser ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {`Delete "${deleteTarget?.username || 'this user'}"? The account will be deactivated and hidden from active users.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(resetUserId)} onClose={() => setResetUserId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a temporary password. The user can change it after signing in.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Temporary Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            helperText="Minimum 6 characters"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setResetUserId(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleResetPassword}>Reset Password</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((current) => ({ ...current, open: false }))}
          sx={{ whiteSpace: 'pre-line' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default UserManagement;

