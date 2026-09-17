import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Typography, Box, Button, Grid,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Switch, FormControlLabel,
  Card, Avatar, Divider, Tooltip, Paper, InputAdornment,
  Snackbar, Alert, Stack
} from '@mui/material';
import {
  EditRounded,
  LockResetRounded,
  DeleteRounded,
  PersonAddRounded,
  EmailOutlined,
  BusinessOutlined,
  BadgeOutlined,
  SearchRounded,
  GroupsRounded,
  CheckCircleOutlineRounded,
  BlockOutlined
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
    ...departments.map((department) => ({
      label: department.name,
      department,
      type: 'department',
    })),
    { label: 'Dean', role: 'DEAN', type: 'role' },
    { label: 'Admin', role: 'ADMIN', type: 'role' },
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
    const matchesRole = currentPage?.role ? user.role === currentPage.role : ['HOD', 'FACULTY'].includes(user.role);
    const matchesDepartment = currentPage?.type === 'department' ? user.department === currentPage.department.id : true;
    return matchesRole && matchesDepartment && userMatchesSearch(user);
  });

  const departmentPage = currentPage?.type === 'department'
    ? {
      id: currentPage.department.id,
      name: currentPage.department.name,
      blockName: currentPage.department.block_name,
      hods: filteredUsers.filter((user) => user.role === 'HOD'),
      faculty: filteredUsers.filter((user) => user.role === 'FACULTY'),
    }
    : null;

  const visibleUserStats = {
    total: filteredUsers.length,
    active: filteredUsers.filter((user) => user.is_active).length,
    inactive: filteredUsers.filter((user) => !user.is_active).length,
  };

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
      <Grid item xs={12} sm={6} lg={4} key={user.id}>
        <Card sx={{
          p: 2.25,
          minHeight: '100%',
          border: '1px solid #dbe5ef',
          borderRadius: 2,
          boxShadow: 'none',
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
          '&:hover': { borderColor: '#9fc5f8', boxShadow: '0 16px 36px -30px rgba(15, 32, 58, 0.55)' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ width: 44, height: 44, bgcolor: roleStyle.bg, color: roleStyle.color, fontWeight: 900, fontSize: '0.9rem' }}>
              {user.first_name?.[0] || user.username?.[0]}{user.last_name?.[0]}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 900, color: '#0f172a' }}>
                {getUserName(user)}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <BadgeOutlined sx={{ fontSize: '0.95rem' }} /> @{user.username}
              </Typography>
            </Box>
            <Chip
              label={user.role}
              size="small"
              sx={{ bgcolor: roleStyle.bg, color: roleStyle.color, fontWeight: 850, borderRadius: 1.25 }}
            />
          </Box>

          <Divider sx={{ mb: 1.75 }} />

          <Stack spacing={1.1} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <EmailOutlined sx={{ color: '#7c8da3', fontSize: '1.1rem' }} />
              <Typography variant="body2" noWrap sx={{ color: '#334155', minWidth: 0 }}>{user.email || 'Email not provided'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <BusinessOutlined sx={{ color: '#7c8da3', fontSize: '1.1rem' }} />
              <Typography variant="body2" noWrap sx={{ color: '#334155' }}>{user.department_name || 'Institution-wide'}</Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid #edf2f7' }}>
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
              sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8rem', fontWeight: 800, color: user.is_active ? '#047857' : '#b91c1c' } }}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Edit User">
                <IconButton onClick={() => handleOpen(user)} size="small" sx={{ color: '#237dba', border: '1px solid #dbeafe' }}>
                  <EditRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset Password">
                <IconButton onClick={() => openResetPasswordDialog(user.id)} size="small" sx={{ color: '#b7791f', border: '1px solid #fde7ad' }}>
                  <LockResetRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton onClick={() => setDeleteTarget(user)} size="small" sx={{ color: '#dc2626', border: '1px solid #fecdd3' }}>
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
      <Paper elevation={0} sx={{ mb: 2.5, p: { xs: 2.25, md: 3 }, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ color: '#237dba', fontWeight: 900 }}>Admin directory</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.55rem', sm: '2rem' }, lineHeight: 1.15 }}>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
              Create accounts and manage access status for institutional users.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddRounded />}
            onClick={() => handleOpen()}
            sx={{ width: { xs: '100%', md: 'auto' }, minWidth: 170, whiteSpace: 'nowrap' }}
          >
            Add New User
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff' }}>
        <Grid container spacing={1.75} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, username, email, or department"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchRounded sx={{ color: '#64748b' }} /></InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department or role"
              value={currentPage ? page : ''}
              disabled={pageOptions.length === 0}
              onChange={(event) => handlePageChange(event, Number(event.target.value))}
            >
              {pageOptions.map((option, index) => (
                <MenuItem key={`${option.type}-${option.department?.id || option.role}`} value={index + 1}>
                  {option.type === 'department' ? `${option.label} Department` : `${option.label} Accounts`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip icon={<GroupsRounded />} label={`${visibleUserStats.total} shown`} sx={{ fontWeight: 800, bgcolor: '#eef5ff', color: '#237dba' }} />
              <Chip icon={<CheckCircleOutlineRounded />} label={`${visibleUserStats.active} active`} sx={{ fontWeight: 800, bgcolor: '#ecfdf3', color: '#087f5b' }} />
              {visibleUserStats.inactive > 0 && (
                <Tooltip title={`${visibleUserStats.inactive} inactive accounts`}>
                  <Chip icon={<BlockOutlined />} label={visibleUserStats.inactive} sx={{ fontWeight: 800, bgcolor: '#fff1f0', color: '#c2413b' }} />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>{currentPage?.label || 'Users'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
          {currentPage?.role
            ? `${currentPage.label} accounts across the institution.`
            : `${departmentPage?.blockName || 'Block not assigned'} | ${departmentPage?.hods.length || 0} HOD | ${departmentPage?.faculty.length || 0} Faculty`}
        </Typography>
      </Box>

      {currentPage?.role ? (
        <Grid container spacing={3}>
          {filteredUsers.length > 0 ? filteredUsers.map(renderUserCard) : (
            <Grid item xs={12} sx={{ py: 10, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">No user accounts found.</Typography>
            </Grid>
          )}
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {departmentPage ? (
            <Box
              key={departmentPage.id}
              sx={{ pb: 2 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#8a6f00', mb: 1.5 }}>HOD</Typography>
                <Grid container spacing={2.5}>
                  {departmentPage.hods.length > 0 ? departmentPage.hods.map(renderUserCard) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No HOD assigned to this department.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1f7f79', mb: 1.5 }}>Faculty</Typography>
                <Grid container spacing={2.5}>
                  {departmentPage.faculty.length > 0 ? departmentPage.faculty.map(renderUserCard) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No faculty assigned to this department.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">No departments found.</Typography>
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
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Assigned Role" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="DEAN">Dean</MenuItem>
                  <MenuItem value="HOD">HOD</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
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

