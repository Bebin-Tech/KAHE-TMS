import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Typography, Box, Paper, Grid, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Stack
} from '@mui/material';
import { AssessmentRounded, FilterAltOffRounded, SearchRounded } from '@mui/icons-material';
import api from '../api/axios';

const statusOptions = [
  'ASSIGNED',
  'IN_PROGRESS',
  'SUBMITTED',
  'SUBMITTED_DEAN',
  'APPROVED_HOD',
  'REJECTED_HOD',
  'REJECTED_DEAN',
  'COMPLETED'
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
  if (['COMPLETED', 'APPROVED_HOD'].includes(status)) return { bg: '#ecfdf5', color: '#047857' };
  if (['REJECTED_HOD', 'REJECTED_DEAN'].includes(status)) return { bg: '#fef2f2', color: '#b91c1c' };
  if (['SUBMITTED', 'SUBMITTED_DEAN'].includes(status)) return { bg: '#ecfeff', color: '#0e7490' };
  if (status === 'IN_PROGRESS') return { bg: '#fff7ed', color: '#c2410c' };
  return { bg: '#eff6ff', color: '#1d4ed8' };
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    task_name: '',
    dean: '',
    hod: '',
    faculty: '',
    status: '',
    date_from: '',
    date_to: ''
  });

  const deanUsers = useMemo(() => users.filter((user) => user.role === 'DEAN'), [users]);
  const hodUsers = useMemo(() => users.filter((user) => user.role === 'HOD'), [users]);
  const facultyUsers = useMemo(() => users.filter((user) => user.role === 'FACULTY'), [users]);

  const buildParams = () => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    return params;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('reports/', { params: buildParams() });
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users for report filters:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      task_name: '',
      dean: '',
      hod: '',
      faculty: '',
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
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: '#e9f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AssessmentRounded sx={{ color: 'primary.main', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#212b36' }}>
            Task Workflow Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track Dean, HOD, and Faculty progress from assignment through completion.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3, border: '1px solid #dde5f0', borderRadius: '12px' }}>
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
            <TextField
              fullWidth
              label="Assigned From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Assigned To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
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

      <TableContainer component={Paper} sx={{ border: '1px solid #dde5f0', borderRadius: '12px' }}>
        <Table sx={{ minWidth: 1300 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Task</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Assigned By</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Assigned Date</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Work Start</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Work Completion</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Submission</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Rejection / Resubmission</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : reports.length > 0 ? reports.map((report) => {
              const color = getStatusColor(report.status);
              return (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{report.user_name}</Typography>
                    {report.role === 'FACULTY' && (
                      <Typography variant="caption" color="text.secondary">{report.subtask_title}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{report.role}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{report.task_name}</Typography>
                    <Typography variant="caption" color="text.secondary">Dean: {report.dean_name || 'N/A'} | HOD: {report.hod_name || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>{report.assigned_by_name || 'N/A'}</TableCell>
                  <TableCell>{formatDateTime(report.assigned_at)}</TableCell>
                  <TableCell>{formatDateTime(report.work_started_at)}</TableCell>
                  <TableCell>{formatDateTime(report.work_completed_at)}</TableCell>
                  <TableCell>{formatDateTime(report.submission_at)}</TableCell>
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
