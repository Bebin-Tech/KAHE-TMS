import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  AdminPanelSettingsRounded,
  LockPersonRounded,
  SaveRounded,
  SecurityRounded,
  SettingsRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';

const permissionFields = [
  { key: 'can_access', label: 'Access' },
  { key: 'can_view', label: 'View' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
];

const fallbackModules = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'completed_tasks', label: 'Completed Tasks' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
  { key: 'user_management', label: 'User Management' },
  { key: 'department_management', label: 'Department Management' },
];

const createPermissionRow = (module) => ({
  module: module.key,
  module_label: module.label,
  can_access: false,
  can_view: false,
  can_edit: false,
  can_delete: false,
});

const getUserLabel = (user) => {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.username;
};

const Settings = () => {
  const currentUser = getCurrentSession()?.session?.user || {};
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState(fallbackModules);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissionRows, setPermissionRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)),
    [selectedUserId, users]
  );

  const buildPermissionRows = useCallback((moduleList, savedRows = []) => {
    const savedByModule = savedRows.reduce((acc, row) => {
      acc[row.module] = row;
      return acc;
    }, {});

    return moduleList.map((module) => ({
      ...createPermissionRow(module),
      ...(savedByModule[module.key] || {}),
      module: module.key,
      module_label: module.label,
    }));
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [usersRes, modulesRes] = await Promise.all([
        api.get('users/'),
        api.get('user-module-permissions/modules/'),
      ]);
      const activeUsers = usersRes.data.filter((user) => user.is_active);
      setUsers(activeUsers);
      setModules(modulesRes.data.length ? modulesRes.data : fallbackModules);
      if (activeUsers.length > 0) setSelectedUserId((current) => current || activeUsers[0].id);
    } catch (err) {
      console.error('Error loading access management data:', err);
      setError('Unable to load users or modules.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPermissions = useCallback(async () => {
    if (!selectedUserId) {
      setPermissionRows(buildPermissionRows(modules));
      return;
    }

    try {
      const response = await api.get(`user-module-permissions/?user=${selectedUserId}`);
      setPermissionRows(buildPermissionRows(modules, response.data));
    } catch (err) {
      console.error('Error loading user permissions:', err);
      setError('Unable to load permissions for the selected user.');
      setPermissionRows(buildPermissionRows(modules));
    }
  }, [buildPermissionRows, modules, selectedUserId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!loading) fetchUserPermissions();
  }, [fetchUserPermissions, loading]);

  const handlePermissionChange = (module, field, checked) => {
    setPermissionRows((rows) => rows.map((row) => {
      if (row.module !== module) return row;

      const nextRow = { ...row, [field]: checked };
      if (field === 'can_access' && !checked) {
        nextRow.can_view = false;
        nextRow.can_edit = false;
        nextRow.can_delete = false;
      }
      if (field !== 'can_access' && checked) {
        nextRow.can_access = true;
      }
      return nextRow;
    }));
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      setError('Select a user before saving permissions.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await api.post('user-module-permissions/bulk_save/', {
        user: selectedUserId,
        permissions: permissionRows,
      });
      setPermissionRows(buildPermissionRows(modules, response.data));
      setMessage('Permission changes saved.');
    } catch (err) {
      console.error('Error saving user permissions:', err);
      setError(err.response?.data?.error || 'Unable to save permission changes.');
    } finally {
      setSaving(false);
    }
  };

  if (currentUser.role !== 'ADMIN') {
    return (
      <DashboardLayout title="Settings">
        <Paper sx={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 5 }, border: '1px solid #dde5f0' }}>
          <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
            <Box sx={{ width: 88, height: 88, mx: 'auto', mb: 2.5, borderRadius: 2, bgcolor: '#eef5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsRounded sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>Account Settings</Typography>
            <Typography variant="body1" color="text.secondary">Access management is available to administrators.</Typography>
          </Box>
        </Paper>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Settings">
      <Paper elevation={0} sx={{ mb: 3, p: { xs: 2.5, md: 3 }, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ color: '#237dba', fontWeight: 900 }}>Admin settings</Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              User Access Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a user and configure module-level access, view, edit, and delete permissions.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
            onClick={handleSave}
            disabled={saving || loading || !selectedUserId}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' }, minWidth: 180 }}
          >
            Save Permissions
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #dde5f0' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Avatar sx={{ bgcolor: '#eaf3ff', color: '#237dba' }}>
                <LockPersonRounded />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Select User</Typography>
                <Typography variant="body2" color="text.secondary">Permissions are saved per user.</Typography>
              </Box>
            </Stack>

            <FormControl fullWidth disabled={loading || users.length === 0}>
              <InputLabel>User</InputLabel>
              <Select
                label="User"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {getUserLabel(user)} - {user.role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedUser && (
              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: '#f6f6f7', border: '1px solid #e5e2df' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{getUserLabel(selectedUser)}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedUser.email || selectedUser.username}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#1f7f79', fontWeight: 900 }}>
                  {selectedUser.role}{selectedUser.department_name ? ` - ${selectedUser.department_name}` : ''}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #dde5f0' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e7edf5', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SecurityRounded sx={{ color: '#237dba' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Module Permissions</Typography>
                <Typography variant="body2" color="text.secondary">Toggle permissions for each module before saving.</Typography>
              </Box>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 720 }}>
                <TableHead sx={{ bgcolor: '#f4f9ff' }}>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    {permissionFields.map((field) => (
                      <TableCell key={field.key} align="center">{field.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : permissionRows.map((row) => (
                    <TableRow key={row.module} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#ececf1', color: '#1E1E2C' }}>
                            <AdminPanelSettingsRounded fontSize="small" />
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{row.module_label}</Typography>
                        </Stack>
                      </TableCell>
                      {permissionFields.map((field) => (
                        <TableCell key={field.key} align="center">
                          <Switch
                            checked={Boolean(row[field.key])}
                            onChange={(event) => handlePermissionChange(row.module, field.key, event.target.checked)}
                            color={field.key === 'can_delete' ? 'error' : 'primary'}
                            inputProps={{ 'aria-label': `${field.label} ${row.module_label}` }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2600}
        onClose={() => setMessage('')}
        message={message}
      />
    </DashboardLayout>
  );
};

export default Settings;
