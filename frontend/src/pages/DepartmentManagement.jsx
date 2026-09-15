import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Avatar, Snackbar, Alert,
  Chip, CircularProgress, InputAdornment, Stack, Tooltip
} from '@mui/material';
import {
  AddRounded,
  ApartmentRounded,
  BusinessRounded,
  DeleteRounded,
  EditRounded,
  LocationOnRounded,
  SearchRounded,
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    block_name: ''
  });
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const showMessage = useCallback((message, severity = 'success') => {
    setNotification({ open: true, severity, message });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('departments/');
      setDepartments(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error('Error fetching departments:', err);
      showMessage(formatApiError(err, 'Unable to load departments.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    setSaving(true);
    try {
      if (editingDept) {
        await api.patch(`departments/${editingDept.id}/`, formData);
      } else {
        await api.post('departments/', formData);
      }
      setOpen(false);
      showMessage(editingDept ? 'Department updated successfully.' : 'Department created successfully.');
      await fetchData();
    } catch (err) {
      console.error('Error saving department:', err);
      if (err.response?.status === 401) return;
      showMessage(formatApiError(err, 'Failed to save department.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`departments/${deleteTarget.id}/`);
      setDeleteTarget(null);
      showMessage('Department deleted successfully.');
      await fetchData();
    } catch (err) {
      console.error('Error deleting department:', err);
      showMessage(formatApiError(err, 'Failed to delete department.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((department) => (
      `${department.name || ''} ${department.block_name || ''}`.toLowerCase().includes(term)
    ));
  }, [departments, search]);

  return (
    <DashboardLayout title="Department Management">
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-end' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#0f766e', fontWeight: 900, letterSpacing: 1.2 }}>
            University structure
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 950, mb: 0.65, color: '#0f172a', fontSize: { xs: '1.55rem', sm: '2rem' }, lineHeight: 1.15 }}>
            Departments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage academic departments and their assigned campus blocks.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => handleOpen()}
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' }, minHeight: 44, px: 2.25, fontWeight: 850, borderRadius: 1.5 }}
        >
          Add Department
        </Button>
      </Box>

      <Paper elevation={0} sx={{ mb: 2, p: { xs: 1.5, sm: 1.75 }, border: '1px solid #dbe5ef', borderRadius: 2, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search department or block"
            inputProps={{ 'aria-label': 'Search departments' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchRounded sx={{ color: '#64748b' }} /></InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 360 }, '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc' } }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#ecfdf5', color: '#047857' }}>
              <ApartmentRounded fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 750, lineHeight: 1.1 }}>Total departments</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 950, color: '#0f172a', lineHeight: 1.2 }}>{departments.length}</Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #d8e3f0', borderRadius: 2.5, overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 16px 44px -40px rgba(15,23,42,0.42)' }}>
        <Table sx={{ minWidth: 620 }} aria-label="Departments">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ width: 72, fontWeight: 900, color: '#64748b', py: 1.6 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 1.6 }}>Department</TableCell>
              <TableCell sx={{ width: '28%', fontWeight: 900, color: '#475569', py: 1.6 }}>Campus Block</TableCell>
              <TableCell align="right" sx={{ width: 130, fontWeight: 900, color: '#475569', py: 1.6 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 9 }}><CircularProgress size={30} /></TableCell>
              </TableRow>
            ) : filteredDepartments.length > 0 ? filteredDepartments.map((dept, index) => (
              <TableRow key={dept.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fbff' } }}>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 800 }}>{String(index + 1).padStart(2, '0')}</TableCell>
                <TableCell sx={{ py: 1.45 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar variant="rounded" sx={{ bgcolor: '#eaf3ff', color: '#2563eb', width: 40, height: 40, borderRadius: 1.5 }}>
                      <BusinessRounded />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>{dept.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Academic department</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    icon={<LocationOnRounded />}
                    label={dept.block_name || 'Not assigned'}
                    sx={{ bgcolor: dept.block_name ? '#f0fdfa' : '#f8fafc', color: dept.block_name ? '#0f766e' : '#64748b', fontWeight: 800, border: '1px solid #dbe5ef' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit department">
                    <IconButton aria-label={`Edit ${dept.name}`} onClick={() => handleOpen(dept)} size="small" sx={{ mr: 0.5, color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                      <EditRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete department">
                    <IconButton aria-label={`Delete ${dept.name}`} onClick={() => setDeleteTarget(dept)} size="small" sx={{ color: '#dc2626', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 9 }}>
                  <BusinessRounded sx={{ fontSize: 42, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#334155' }}>
                    {search ? 'No matching departments' : 'No departments yet'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {search ? 'Try a different department or block name.' : 'Add the first department to begin.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ px: 2.5, py: 2, bgcolor: '#f8fbff', borderBottom: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar variant="rounded" sx={{ bgcolor: '#eaf3ff', color: '#2563eb', borderRadius: 1.5 }}><BusinessRounded /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>{editingDept ? 'Edit Department' : 'Add Department'}</Typography>
                <Typography variant="caption" color="text.secondary">Enter the department and its campus location.</Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 2.5, py: 2.5 }}>
            <Grid container spacing={2}>
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
                  placeholder="e.g. S-Block"
                  value={formData.block_name}
                  onChange={(e) => setFormData({...formData, block_name: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.75, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
            <Button variant="outlined" color="inherit" disabled={saving} onClick={() => setOpen(false)} sx={{ bgcolor: '#ffffff', fontWeight: 800, minWidth: 96 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ borderRadius: 1.5, px: 3, minWidth: 150, fontWeight: 850, textTransform: 'none' }}
            >
              {saving ? <CircularProgress size={21} color="inherit" /> : editingDept ? 'Save Changes' : 'Add Department'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {`Delete "${deleteTarget?.name || 'this department'}"? It will no longer appear in active department lists.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button disabled={deleting} onClick={handleDelete} color="error" variant="contained">
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
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

export default DepartmentManagement;

