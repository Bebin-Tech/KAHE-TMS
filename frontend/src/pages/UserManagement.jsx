import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid, Switch, FormControlLabel
} from '@mui/material';
import { AddRounded, EditRounded, LockResetRounded, DeleteRounded, PersonAddRounded } from '@mui/icons-material';
import api from '../api/axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    role: 'FACULTY', department: '', password: ''
  });

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
    try {
      if (editingUser) {
        await api.patch(`users/${editingUser.id}/`, formData);
      } else {
        await api.post('users/create_user/', formData);
      }
      setOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
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

  return (
    <DashboardLayout title="User Management">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Manage Personnel</Typography>
          <Typography variant="body1" color="text.secondary">Create and manage accounts for Dean, HOD, and Faculty.</Typography>
        </Box>
        <Button
          variant="contained" startIcon={<PersonAddRounded />}
          onClick={() => handleOpen()} sx={{ borderRadius: 3, px: 3, py: 1.5 }}
        >
          Add New User
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Username / Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.first_name} {user.last_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell>{user.department_name || 'N/A'}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={<Switch checked={user.is_active} onChange={() => toggleActive(user.id)} size="small" />}
                    label={user.is_active ? "Active" : "Inactive"}
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(user)} size="small" color="primary">
                    <EditRounded fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="warning">
                    <LockResetRounded fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteRounded fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
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
                <TextField select fullWidth label="Role" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
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
            <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Save User</Button>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserManagement;
