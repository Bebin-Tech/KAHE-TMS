import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Avatar, Snackbar, Alert
} from '@mui/material';
import { AddRounded, EditRounded, DeleteRounded, BusinessRounded } from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    block_name: ''
  });
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const showMessage = (message, severity = 'success') => {
    setNotification({ open: true, severity, message });
  };

  const fetchData = async () => {
    try {
      const res = await api.get('departments/');
      setDepartments(res.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        block_name: dept.block_name || ''
      });
    } else {
      setEditingDept(null);
      setFormData({
        name: '',
        block_name: ''
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await api.patch(`departments/${editingDept.id}/`, formData);
      } else {
        await api.post('departments/', formData);
      }
      setOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving department:', err);
      if (err.response?.status === 401) return;
      showMessage(formatApiError(err, 'Failed to save department.'), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`departments/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting department:', err);
        showMessage(formatApiError(err, 'Failed to delete department.'), 'error');
      }
    }
  };

  return (
    <DashboardLayout title="Department Management">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#212b36' }}>Departments</Typography>
          <Typography variant="body2" color="text.secondary">Manage university departments and their physical locations.</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddRounded />}
          onClick={() => handleOpen()}
          sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
        >
          Add Department
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f4f9ff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Department Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Block Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#637381' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length > 0 ? departments.map((dept) => (
              <TableRow key={dept.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#eaf3ff', color: '#237dba' }}>
                      <BusinessRounded />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36' }}>{dept.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#637381' }}>{dept.block_name || 'N/A'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(dept)} size="small" sx={{ color: '#237dba' }}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(dept.id)} size="small" sx={{ color: '#f44336' }}>
                    <DeleteRounded fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">No departments found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>{editingDept ? 'Edit Department' : 'New Department'}</DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department Name"
                  placeholder="e.g. Computer Science"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department Block Name"
                  placeholder="e.g. Ramanujan Block"
                  value={formData.block_name}
                  onChange={(e) => setFormData({...formData, block_name: e.target.value})}
                />
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
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogActions>
        </form>
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

export default DepartmentManagement;

