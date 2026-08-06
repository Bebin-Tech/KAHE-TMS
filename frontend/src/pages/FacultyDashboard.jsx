import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SubmitWorkDialog from '../components/SubmitWorkDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import {
  AssignmentRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloudUploadRounded,
  FactCheckRounded,
  HistoryRounded,
  PendingActionsRounded,
  TrendingUpRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const statusStyles = {
  ASSIGNED: { label: 'Assigned', bg: '#eaf3ff', color: '#237dba' },
  IN_PROGRESS: { label: 'In Progress', bg: '#fff8d9', color: '#8a6f00' },
  SUBMITTED: { label: 'HOD Review', bg: '#eef2ff', color: '#4338ca' },
  APPROVED_HOD: { label: 'Approved', bg: '#e8f7f6', color: '#1f7f79' },
  COMPLETED: { label: 'Completed', bg: '#e8f7f6', color: '#1f7f79' },
  REJECTED_HOD: { label: 'Rework', bg: '#fef2f2', color: '#b91c1c' },
};

const getStatusStyle = (status) => statusStyles[status] || statusStyles.ASSIGNED;

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const FacultyStatusPill = ({ icon, label, value, bg, color }) => (
  <Box
    sx={{
      minWidth: 122,
      px: 1.25,
      py: 0.75,
      borderRadius: 999,
      bgcolor: bg,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      border: '1px solid rgba(255,255,255,0.74)',
      boxShadow: '0 12px 28px -22px rgba(15,23,42,0.45)',
    }}
  >
    <Avatar
      sx={{
        width: 28,
        height: 28,
        bgcolor: 'rgba(15,23,42,0.58)',
        color: '#ffffff',
      }}
    >
      {icon}
    </Avatar>
    <Typography
      variant="body2"
      sx={{
        color,
        fontWeight: 900,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {value} {label}
    </Typography>
  </Box>
);

const FacultyDashboard = () => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('subtasks/');
      setSubtasks(response.data);
    } catch (err) {
      console.error('Error fetching subtasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 10000, !dialogOpen);

  const handleOpenSubmit = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleUpdateProgress = async (id, current) => {
    const next = current + 25 > 100 ? 100 : current + 25;
    try {
      await api.post(`subtasks/${id}/update_progress/`, { progress: next });
      fetchData();
    } catch (err) {
      setNotification({
        open: true,
        severity: 'error',
        message: formatApiError(err, 'Failed to update progress.'),
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const completedCount = subtasks.filter((task) => ['APPROVED_HOD', 'COMPLETED'].includes(task.status)).length;
  const submittedCount = subtasks.filter((task) => task.status === 'SUBMITTED').length;
  const activeCount = subtasks.filter((task) => !['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status)).length;
  const progressAverage = subtasks.length
    ? Math.round(subtasks.reduce((total, task) => total + Number(task.progress || 0), 0) / subtasks.length)
    : 0;

  return (
    <DashboardLayout title="My Assignments">
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          border: '1px solid #bfdbfe',
          bgcolor: '#eff6ff',
          background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 58%, #e8f7f6 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 24px 62px -46px rgba(37,99,235,0.62)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="overline" sx={{ color: '#237dba', fontWeight: 900 }}>Faculty workspace</Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.7rem', sm: '2.35rem' }, lineHeight: 1.1 }}>
                Assigned work queue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680 }}>
                Review assigned tasks, update progress, and submit completed work for HOD verification.
              </Typography>
            </Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ flexShrink: 0 }}
            >
              <FacultyStatusPill icon={<AssignmentRounded sx={{ fontSize: 18 }} />} label="active" value={activeCount} bg="#dbeafe" color="#2563eb" />
              <FacultyStatusPill icon={<PendingActionsRounded sx={{ fontSize: 18 }} />} label="in review" value={submittedCount} bg="#fff8d9" color="#8a6f00" />
              <FacultyStatusPill icon={<CheckCircleRounded sx={{ fontSize: 18 }} />} label="approved" value={completedCount} bg="#ccfbf1" color="#0f766e" />
            </Stack>
          </Stack>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: -60, bottom: -90, width: 260, height: 260, border: '38px solid rgba(37,99,235,0.13)', borderRadius: '50%' }} />
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Assignments', value: subtasks.length, helper: 'Faculty tasks received', icon: <AssignmentRounded />, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Average Progress', value: `${progressAverage}%`, helper: 'Across assigned work', icon: <TrendingUpRounded />, color: '#0f766e', bg: '#ccfbf1' },
          { label: 'Waiting Review', value: submittedCount, helper: 'Submitted to HOD', icon: <PendingActionsRounded />, color: '#8a6f00', bg: '#fff8d9' },
        ].map((item) => (
          <Grid item xs={12} sm={4} key={item.label}>
            <Paper sx={{ p: 2.25, borderRadius: 3, border: '1px solid #d8e3f0', height: '100%', boxShadow: '0 18px 48px -42px rgba(15,23,42,0.5)' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: item.bg, color: item.color, width: 44, height: 44 }}>{item.icon}</Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>{item.value}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.helper}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 3, border: '1px solid #d8e3f0', overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 22px 58px -46px rgba(15,23,42,0.55)' }}>
            <Box
              sx={{
                p: { xs: 2.25, md: 3 },
                borderBottom: '1px solid #e7edf5',
                bgcolor: '#f8fbff'
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>My Task List</Typography>
                  <Typography variant="body2" color="text.secondary">Submit completed work or keep progress current for HOD review.</Typography>
                </Box>
                <Chip
                  label={`${subtasks.length} ${subtasks.length === 1 ? 'task' : 'tasks'}`}
                  sx={{ bgcolor: '#eaf3ff', color: '#1d4ed8', fontWeight: 900, borderRadius: 1.5 }}
                />
              </Stack>
            </Box>

            {subtasks.length === 0 ? (
              <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                  No active tasks assigned to you at the moment.
                </Alert>
              </Box>
            ) : (
              <Stack spacing={1.6} sx={{ p: { xs: 2, md: 2.5 } }}>
                {subtasks.map((task) => {
                  const status = getStatusStyle(task.status);
                  const isLocked = ['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status);
                  return (
                    <Paper
                      key={task.id}
                      elevation={0}
                      sx={{
                        p: { xs: 1.65, md: 2 },
                        borderRadius: 2.5,
                        border: '1px solid #dbe7f5',
                        bgcolor: '#ffffff',
                        boxShadow: '0 16px 40px -36px rgba(15,23,42,0.55)',
                        transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                        '&:hover': {
                          bgcolor: '#fbfdff',
                          borderColor: '#bfdbfe',
                          boxShadow: '0 20px 48px -38px rgba(37,99,235,0.42)',
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 56,
                                minHeight: 86,
                                borderRadius: 2,
                                bgcolor: status.bg,
                                color: status.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(15,23,42,0.04)',
                                flexShrink: 0,
                              }}
                            >
                              <Avatar sx={{ bgcolor: '#ffffff', color: status.color, width: 36, height: 36, boxShadow: '0 12px 24px -20px rgba(15,23,42,0.45)' }}>
                                {['APPROVED_HOD', 'COMPLETED'].includes(task.status) ? <FactCheckRounded /> : <AssignmentRounded />}
                              </Avatar>
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                                  {task.title}
                                </Typography>
                                <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 900, borderRadius: 1.5 }} />
                              </Stack>
                              <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 850 }}>
                                Assigned by HOD: {task.created_by_name || 'HOD'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                                {task.description || 'No description provided.'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Stack spacing={1.25}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#475569' }}>
                              <CalendarMonthRounded sx={{ fontSize: 18 }} />
                              <Typography variant="body2" sx={{ fontWeight: 850 }}>
                                Due {formatDate(task.deadline)}
                              </Typography>
                            </Stack>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 800 }}>Parent task</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 850, color: '#0f172a' }}>{task.task_title || 'Department assignment'}</Typography>
                            </Box>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: '#475569' }}>Work Completion</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 900, color: '#0f172a' }}>{task.progress || 0}%</Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={task.progress || 0} sx={{ height: 9, borderRadius: 5, bgcolor: '#e6edf5' }} />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.1} alignItems="stretch">
                            <Button
                              variant="contained"
                              startIcon={<CloudUploadRounded />}
                              onClick={() => handleOpenSubmit(task)}
                              disabled={isLocked}
                              sx={{ fontWeight: 850 }}
                            >
                              {task.status === 'SUBMITTED' ? 'Submitted' : task.status === 'APPROVED_HOD' ? 'Approved' : 'Submit Work'}
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<HistoryRounded />}
                              onClick={() => handleUpdateProgress(task.id, task.progress || 0)}
                              disabled={task.progress === 100 || isLocked}
                              sx={{ fontWeight: 850, bgcolor: '#ffffff' }}
                            >
                              Update Progress
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

      </Grid>

      <SubmitWorkDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        subtaskId={selectedTask?.id}
        onSubmitted={fetchData}
      />
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
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
