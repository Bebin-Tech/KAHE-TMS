import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Typography, Box, Paper, Grid, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Stack
} from '@mui/material';
import { AssessmentRounded, AssignmentOutlined, FilterAltOffRounded, RefreshRounded, SearchRounded } from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';

const statusOptions = [
  'ASSIGNED',
  'IN_PROGRESS',
  'SUBMITTED',
  'SUBMITTED_DEAN',
  'APPROVED_HOD',
  'REJECTED_HOD',
  'REJECTED_DEAN',
  'DEAN_APPROVED',
  'COMPLETED'
];

const actionOptions = [
  'Created task',
  'Assigned task to HOD',
  'Assigned sub-task to Faculty',
  'Started task work',
  'Worked on sub-task',
  'Submitted work to HOD',
  'Faculty work approved by HOD',
  'Faculty work rejected by HOD',
  'Reviewed and approved faculty submission',
  'Reviewed and rejected faculty submission',
  'Submitted task to Dean',
  'Received task for review',
  'Verified task',
  'Rejected task',
  'Task verified by Dean',
  'Completed task',
  'Task completed by HOD'
];

const formatDateTime = (value) => {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const statusLabel = (status) => status?.replaceAll('_', ' ') || 'Unknown';

const getStatusColor = (status) => {
  if (['COMPLETED', 'APPROVED_HOD', 'DEAN_APPROVED'].includes(status)) return { bg: '#e8f7f6', color: '#1f7f79' };
  if (['REJECTED_HOD', 'REJECTED_DEAN'].includes(status)) return { bg: '#fef2f2', color: '#b91c1c' };
  if (['SUBMITTED', 'SUBMITTED_DEAN'].includes(status)) return { bg: '#eaf3ff', color: '#237dba' };
  if (status === 'IN_PROGRESS') return { bg: '#fff8d9', color: '#8a6f00' };
  return { bg: '#eaf3ff', color: '#237dba' };
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [deanTasks, setDeanTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentRole = getCurrentSession()?.role;
  const isDean = currentRole === 'DEAN';
  const [filters, setFilters] = useState({
    task_name: '',
    dean: '',
    hod: '',
    faculty: '',
    action: '',
    status: '',
    date_from: '',
    date_to: ''
  });

  const deanUsers = useMemo(() => users.filter((user) => user.role === 'DEAN'), [users]);
  const hodUsers = useMemo(() => users.filter((user) => user.role === 'HOD'), [users]);
  const facultyUsers = useMemo(() => users.filter((user) => user.role === 'FACULTY'), [users]);

  const visibleReports = useMemo(() => (
    isDean ? reports.filter((report) => ['HOD', 'FACULTY'].includes(report.role)) : reports
  ), [isDean, reports]);

  const deanTaskProgress = useMemo(() => deanTasks.map((task) => {
    const activeFaculty = (task.subtasks || []).filter((subtask) => !['APPROVED_HOD', 'COMPLETED'].includes(subtask.status));
    const completedFaculty = (task.subtasks || []).filter((subtask) => ['APPROVED_HOD', 'COMPLETED'].includes(subtask.status));
    const currentWorker = activeFaculty.length > 0
      ? activeFaculty.map((subtask) => subtask.assigned_to_name || 'Faculty').join(', ')
      : task.assigned_to_hod_name || 'Assigned HOD';
    const isCompleted = ['COMPLETED', 'DEAN_APPROVED'].includes(task.status);

    return {
      ...task,
      currentWorker: isCompleted ? 'Completed' : currentWorker,
      facultyProgress: `${completedFaculty.length}/${task.subtasks?.length || 0}`,
      isCompleted,
    };
  }), [deanTasks]);

  const buildParams = useCallback(() => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    return params;
  }, [filters]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [reportResponse, taskResponse] = await Promise.all([
        api.get('reports/', { params: buildParams() }),
        isDean
          ? api.get('tasks/', {
              params: { refresh: Date.now() },
              headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
            })
          : Promise.resolve({ data: [] }),
      ]);
      setReports(reportResponse.data);
      if (isDean) setDeanTasks(taskResponse.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [buildParams, isDean]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users for report filters:', err);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [usersResponse, refreshResponse, taskResponse] = await Promise.all([
        api.get('users/'),
        api.post('reports/refresh/', null, { params: buildParams() }),
        isDean
          ? api.get('tasks/', {
              params: { refresh: Date.now() },
              headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
            })
          : Promise.resolve({ data: [] }),
      ]);
      setUsers(usersResponse.data);
      setReports(refreshResponse.data.results || []);
      if (isDean) setDeanTasks(taskResponse.data);
    } catch (err) {
      console.error('Error refreshing reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      task_name: '',
      dean: '',
      hod: '',
      faculty: '',
      action: '',
      status: '',
      date_from: '',
      date_to: ''
    });
  };

  const renderUserOption = (user) => (
    <MenuItem key={user.id} value={user.id}>
      {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}
    </MenuItem>
  );

  return (
    <DashboardLayout title="Reports">
      <Box sx={{ mb: 3, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box sx={{ width: 56, height: 56, flexShrink: 0, borderRadius: '14px', bgcolor: '#eaf3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AssessmentRounded sx={{ color: 'primary.main', fontSize: 32 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.45rem', sm: '2.125rem' } }}>
            Task Workflow Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track Dean, HOD, and Faculty progress from assignment through completion.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshRounded />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'center' },
            bgcolor: 'white',
            borderColor: '#b7d5fb',
            color: '#237dba',
            boxShadow: '0 14px 30px -24px rgba(35,125,186,0.72)',
            '&:hover': {
              bgcolor: '#eaf3ff',
              borderColor: '#2563eb'
            }
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {!isDean && (
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid #d8e3f0', borderRadius: 3, bgcolor: '#ffffff', boxShadow: '0 20px 54px -42px rgba(15,23,42,0.38)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Task Name"
                value={filters.task_name}
                onChange={(e) => handleFilterChange('task_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Dean" value={filters.dean} onChange={(e) => handleFilterChange('dean', e.target.value)}>
                <MenuItem value="">All Deans</MenuItem>
                {deanUsers.map(renderUserOption)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="HOD" value={filters.hod} onChange={(e) => handleFilterChange('hod', e.target.value)}>
                <MenuItem value="">All HODs</MenuItem>
                {hodUsers.map(renderUserOption)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Faculty" value={filters.faculty} onChange={(e) => handleFilterChange('faculty', e.target.value)}>
                <MenuItem value="">All Faculty</MenuItem>
                {facultyUsers.map(renderUserOption)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Action" value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)}>
                <MenuItem value="">All Actions</MenuItem>
                {actionOptions.map((action) => (
                  <MenuItem key={action} value={action}>{action}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Activity From"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Activity To"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button fullWidth variant="contained" startIcon={<SearchRounded />} onClick={fetchReports}>
                  Apply
                </Button>
                <Button fullWidth variant="outlined" startIcon={<FilterAltOffRounded />} onClick={clearFilters}>
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      {isDean && (
        <Paper sx={{ mb: 3, border: '1px solid #d8e3f0', borderRadius: 3, overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 20px 54px -42px rgba(15,23,42,0.38)' }}>
          <Box sx={{ p: { xs: 2.25, md: 3 }, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #e7edf5' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#eaf3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AssignmentOutlined sx={{ color: '#237dba' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>Dean Task Progress</Typography>
              <Typography variant="body2" color="text.secondary">Current ownership and completion state for tasks created by Dean.</Typography>
            </Box>
          </Box>
          <TableContainer sx={{ maxHeight: 360, overflow: 'auto' }}>
            <Table sx={{ minWidth: 840 }}>
              <TableHead sx={{ bgcolor: '#f8fbff', position: 'sticky', top: 0, zIndex: 1 }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, color: '#475569' }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: '#475569' }}>HOD</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: '#475569' }}>Currently Working</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: '#475569' }}>Faculty Progress</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: '#475569' }}>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deanTaskProgress.length > 0 ? deanTaskProgress.map((task) => {
                  const color = getStatusColor(task.status);
                  return (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{task.department_name || 'General'}</Typography>
                      </TableCell>
                      <TableCell>{task.assigned_to_hod_name || 'Unassigned'}</TableCell>
                      <TableCell>{task.currentWorker}</TableCell>
                      <TableCell>{task.facultyProgress}</TableCell>
                      <TableCell>
                        <Chip label={statusLabel(task.status)} size="small" sx={{ bgcolor: color.bg, color: color.color, fontWeight: 850 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={task.isCompleted ? 'Yes' : 'No'} size="small" sx={{ bgcolor: task.isCompleted ? '#e8f7f6' : '#fff8d9', color: task.isCompleted ? '#1f7f79' : '#8a6f00', fontWeight: 850 }} />
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">No Dean-created tasks found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <TableContainer
        component={Paper}
        sx={{
          border: '1px solid #d8e3f0',
          borderRadius: 3,
          overflow: 'auto',
          maxHeight: { xs: 'calc(100vh - 220px)', md: 'calc(100vh - 300px)' },
          mb: 4,
          bgcolor: '#ffffff',
          boxShadow: '0 20px 54px -42px rgba(15,23,42,0.45)'
        }}
      >
        <Table sx={{ minWidth: 1350 }}>
          <TableHead sx={{ bgcolor: '#f8fbff', position: 'sticky', top: 0, zIndex: 1 }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Task</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Action Performed</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Action Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Assigned By</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Assigned Date</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Submission / Completion</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Rejection / Resubmission</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Current Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : visibleReports.length > 0 ? visibleReports.map((report) => {
              const color = getStatusColor(report.status);
              return (
                <TableRow key={report.id} hover sx={{ '&:hover': { bgcolor: '#f8fbff' } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: '#0f172a' }}>{report.task_name}</Typography>
                    <Typography variant="caption" color="text.secondary">Dean: {report.dean_name || 'N/A'} | HOD: {report.hod_name || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{report.user_name}</Typography>
                    {report.role === 'FACULTY' && (
                      <Typography variant="caption" color="text.secondary">{report.subtask_title}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{report.role}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{report.action_performed || 'Action recorded'}</Typography>
                  </TableCell>
                  <TableCell>{formatDateTime(report.action_at || report.assigned_at)}</TableCell>
                  <TableCell>{report.assigned_by_name || 'N/A'}</TableCell>
                  <TableCell>{formatDateTime(report.assigned_at)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ display: 'block' }}>Submitted: {formatDateTime(report.submission_at)}</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>Completed: {formatDateTime(report.work_completed_at)}</Typography>
                  </TableCell>
                  <TableCell>
                    {report.rejection_at ? (
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#b91c1c' }}>
                          Rejected by {report.rejected_by_name}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>{formatDateTime(report.rejection_at)}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 220 }}>
                          {report.rejection_reason || 'No reason recorded'}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                          Resubmitted: {formatDateTime(report.resubmission_at)}
                        </Typography>
                      </Box>
                    ) : 'No rejection'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabel(report.status)}
                      size="small"
                      sx={{ bgcolor: color.bg, color: color.color, fontWeight: 800, borderRadius: '8px' }}
                    />
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">No report entries match the selected filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardLayout>
  );
};

export default Reports;

