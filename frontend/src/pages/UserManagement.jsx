import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Paper, Typography, Box, Button, Grid,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Switch, FormControlLabel,
  Card, Avatar, Divider, Tooltip, Pagination, PaginationItem
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

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    role: 'FACULTY', department: '', password: ''
  });

  const roles = ['FACULTY', 'HOD', 'DEAN', 'ADMIN'];

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

  const filteredUsers = users.filter(user => {
    const matchesRole = user.role === roles[page - 1];
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower);

    return matchesRole && matchesSearch;
  });

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
      const errorData = err.response?.data;

      // Handle session expiration specifically
      if (err.response?.status === 401) return;

      let errorMessage = 'Failed to save user account.';
      if (errorData) {
        if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => {
              const val = Array.isArray(value) ? value.join(', ') : (typeof value === 'object' ? JSON.stringify(value) : value);
              return `${key}: ${val}`;
            })
            .join('\n');
        } else {
          errorMessage = errorData;
        }
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`users/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user.');
      }
    }
  };

  const handleResetPassword = async (id) => {
    const newPass = prompt("Enter new temporary password (min 6 characters):");
    if (!newPass) return;
    if (newPass.length < 6) return alert("Password too short.");

    try {
      await api.post(`users/${id}/reset_password/`, { new_password: newPass });
      alert("Password reset successfully.");
    } catch (err) {
      alert("Failed to reset password.");
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
      case 'ADMIN': return { bg: '#d1e9fc', color: '#0c53b7' };
      case 'DEAN': return { bg: '#d0f2ff', color: '#04297a' };
      case 'HOD': return { bg: '#fff7cd', color: '#7a4f01' };
      case 'FACULTY': return { bg: '#ecfdf5', color: '#047857' };
      default: return { bg: '#f4f6f8', color: '#637381' };
    }
  };

  return (
    <DashboardLayout title="User Management">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'flex-end' }, gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', md: 'center' }, gap: 3, flexDirection: { xs: 'column', md: 'row' }, flex: 1 }}>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#212b36' }}>All users</Typography>
            <Typography variant="body2" color="text.secondary">Viewing <b>{roles[page - 1]}</b> accounts.</Typography>
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
              border: '1.5px solid #0066b2',
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
            count={roles.length}
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
                  border: '1px solid #dde5f0',
                  '&:hover': {
                    bgcolor: item.selected ? 'primary.dark' : '#eef5ff'
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

      <Grid container spacing={3}>
        {filteredUsers.length > 0 ? filteredUsers.map((user) => {
          const roleStyle = getRoleColor(user.role);
          return (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
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
                  {user.first_name} {user.last_name}
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
                      <IconButton onClick={() => handleOpen(user)} size="small" sx={{ color: '#1976d2' }}>
                        <EditRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Password">
                      <IconButton onClick={() => handleResetPassword(user.id)} size="small" sx={{ color: '#f59e0b' }}>
                        <LockResetRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(user.id)} size="small" sx={{ color: '#f44336' }}>
                        <DeleteRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
            </Grid>
          );
        }) : (
          <Grid item xs={12} sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No user accounts found.</Typography>
          </Grid>
        )}
      </Grid>

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
              sx={{ bgcolor: '#0066b2', '&:hover': { bgcolor: '#005291' }, borderRadius: 1.5, px: 3, fontWeight: 700, textTransform: 'none' }}
            >
              {editingUser ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserManagement;
