import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
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
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  CheckCircleRounded,
  FilterAltRounded,
  GroupsRounded,
  LockPersonRounded,
  SaveRounded,
  SecurityRounded,
  SettingsRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';
import { clearCachedPermissions, notifyPermissionChange } from '../utils/modulePermissions';

const permissionFields = [
  { key: 'can_access', label: 'Access' },
  { key: 'can_view', label: 'View' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
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

const roleLabels = {
  ADMIN: 'Admin',
  DEAN: 'Dean',
  HOD: 'HOD',
  FACULTY: 'Faculty',
};

const getRoleLabel = (role = '') => roleLabels[role] || role
  .toLowerCase()
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDepartmentValue = (user) => String(user.department || '');
const getDepartmentLabel = (user) => user.department_name || 'No department assigned';

const Settings = () => {
  const currentUser = getCurrentSession()?.session?.user || {};
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [permissionRows, setPermissionRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)),
    [selectedUserId, users]
  );

  const availableRoles = useMemo(() => {
    const roleOrder = ['ADMIN', 'DEAN', 'HOD', 'FACULTY'];
    const roles = [...new Set(users.map((user) => user.role).filter(Boolean))];
    return roles.sort((first, second) => {
      const firstIndex = roleOrder.indexOf(first);
      const secondIndex = roleOrder.indexOf(second);
      if (firstIndex === -1 && secondIndex === -1) return first.localeCompare(second);
      if (firstIndex === -1) return 1;
      if (secondIndex === -1) return -1;
      return firstIndex - secondIndex;
    });
  }, [users]);

  const roleFilteredUsers = useMemo(
    () => users.filter((user) => roleFilter === 'ALL' || user.role === roleFilter),
    [roleFilter, users]
  );

  const availableDepartments = useMemo(() => {
    const departments = new Map();
    roleFilteredUsers.forEach((user) => {
      const value = getDepartmentValue(user);
      if (value) departments.set(value, getDepartmentLabel(user));
    });
    return [...departments.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }, [roleFilteredUsers]);

  const filteredUsers = useMemo(
    () => roleFilteredUsers.filter((user) => (
      departmentFilter === 'ALL' || getDepartmentValue(user) === departmentFilter
    )),
    [departmentFilter, roleFilteredUsers]
  );

  const usersByDepartment = useMemo(() => {
    const groups = new Map();
    filteredUsers.forEach((user) => {
      const department = getDepartmentLabel(user);
      if (!groups.has(department)) groups.set(department, []);
      groups.get(department).push(user);
    });
    return [...groups.entries()].sort(([first], [second]) => first.localeCompare(second));
  }, [filteredUsers]);

  const groupUsersByDepartment = roleFilter === 'HOD' || roleFilter === 'FACULTY';

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
      setModules(modulesRes.data || []);
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

  useEffect(() => {
    if (departmentFilter !== 'ALL' && !availableDepartments.some(({ value }) => value === departmentFilter)) {
      setDepartmentFilter('ALL');
    }
  }, [availableDepartments, departmentFilter]);

  useEffect(() => {
    const selectedIsVisible = filteredUsers.some(
      (user) => String(user.id) === String(selectedUserId)
    );
    if (!selectedIsVisible) setSelectedUserId(filteredUsers[0]?.id || '');
  }, [filteredUsers, selectedUserId]);

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
      clearCachedPermissions(selectedUser);
      notifyPermissionChange(selectedUserId);
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
          <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 2, border: '1px solid #dde5f0' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Avatar sx={{ bgcolor: '#eaf3ff', color: '#237dba' }}>
                <LockPersonRounded />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Select User</Typography>
                <Typography variant="body2" color="text.secondary">Permissions are saved per user.</Typography>
              </Box>
            </Stack>

            <Stack spacing={1.75}>
              <FormControl fullWidth disabled={loading || users.length === 0}>
                <InputLabel>Filter by role</InputLabel>
                <Select
                  label="Filter by role"
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value);
                    setDepartmentFilter('ALL');
                  }}
                  startAdornment={<FilterAltRounded sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="ALL">All roles</MenuItem>
                  {availableRoles.map((role) => (
                    <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {availableDepartments.length > 0 && (
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Filter by department</InputLabel>
                  <Select
                    label="Filter by department"
                    value={departmentFilter}
                    onChange={(event) => setDepartmentFilter(event.target.value)}
                    startAdornment={<GroupsRounded sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="ALL">All departments</MenuItem>
                    {availableDepartments.map((department) => (
                      <MenuItem key={department.value} value={department.value}>
                        {department.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl fullWidth disabled={loading || filteredUsers.length === 0}>
                <InputLabel>User</InputLabel>
                <Select
                  label="User"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
                >
                  {groupUsersByDepartment
                    ? usersByDepartment.flatMap(([department, departmentUsers]) => [
                      <ListSubheader key={`heading-${department}`} sx={{ fontWeight: 900, color: '#237dba' }}>
                        {department}
                      </ListSubheader>,
                      ...departmentUsers.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {getUserLabel(user)}
                        </MenuItem>
                      )),
                    ])
                    : filteredUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {getUserLabel(user)} - {getRoleLabel(user.role)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                {filteredUsers.length} active {filteredUsers.length === 1 ? 'user' : 'users'} found
              </Typography>
            </Stack>

            {selectedUser && (
              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: '#f6f6f7', border: '1px solid #e5e2df' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{getUserLabel(selectedUser)}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedUser.email || selectedUser.username}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#1f7f79', fontWeight: 900 }}>
                  {getRoleLabel(selectedUser.role)}{selectedUser.department_name ? ` - ${selectedUser.department_name}` : ''}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #dde5f0' }}>
            <Box sx={{ p: { xs: 2.25, md: 3 }, borderBottom: '1px solid #e7edf5', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SecurityRounded sx={{ color: '#237dba' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Module Permissions</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select the actions each user is allowed to perform. Enabling an action also enables module access.
                </Typography>
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
                          <Avatar sx={{ width: 34, height: 34, bgcolor: row.can_access ? '#ccfbf1' : '#f1f5f9', color: row.can_access ? '#0f766e' : '#0f172a' }}>
                            {row.can_access ? <CheckCircleRounded fontSize="small" /> : <AdminPanelSettingsRounded fontSize="small" />}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{row.module_label}</Typography>
                          <Chip
                            size="small"
                            label={row.can_access ? 'Enabled' : 'No access'}
                            sx={{
                              fontWeight: 800,
                              color: row.can_access ? '#087f5b' : '#64748b',
                              bgcolor: row.can_access ? '#ecfdf3' : '#f1f5f9',
                            }}
                          />
                        </Stack>
                      </TableCell>
                      {permissionFields.map((field) => (
                        <TableCell key={field.key} align="center">
                          <Checkbox
                            checked={Boolean(row[field.key])}
                            onChange={(event) => handlePermissionChange(row.module, field.key, event.target.checked)}
                            icon={<CheckBoxOutlineBlankRounded sx={{ fontSize: 27 }} />}
                            checkedIcon={<CheckBoxRounded sx={{ fontSize: 27 }} />}
                            inputProps={{ 'aria-label': `${field.label} ${row.module_label}` }}
                            sx={{
                              width: 46,
                              height: 46,
                              p: 0,
                              borderRadius: '50%',
                              color: '#7b8794',
                              transition: 'background-color 140ms ease, color 140ms ease',
                              '&.Mui-checked': {
                                color: field.key === 'can_delete' ? '#dc2626' : '#237dba',
                                bgcolor: field.key === 'can_delete' ? '#fff1f2' : '#eaf3ff',
                              },
                              '&:hover': {
                                bgcolor: field.key === 'can_delete' ? '#fff1f2' : '#eef5ff',
                              },
                            }}
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
