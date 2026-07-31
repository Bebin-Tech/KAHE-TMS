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
  Divider,
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
  const activeCount = subtasks.length - completedCount;
  const progressAverage = subtasks.length
    ? Math.round(subtasks.reduce((total, task) => total + Number(task.progress || 0), 0) / subtasks.length)
    : 0;
  const completionRate = subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : 0;
  const nextTask = subtasks.find((task) => !['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status));

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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Chip icon={<AssignmentRounded />} label={`${activeCount} active`} sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 900, borderRadius: 2 }} />
              <Chip icon={<PendingActionsRounded />} label={`${submittedCount} in review`} sx={{ bgcolor: '#fff8d9', color: '#8a6f00', fontWeight: 900, borderRadius: 2 }} />
              <Chip icon={<CheckCircleRounded />} label={`${completedCount} approved`} sx={{ bgcolor: '#ccfbf1', color: '#0f766e', fontWeight: 900, borderRadius: 2 }} />
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
        <Grid item xs={12} lg={8}>
          <Paper sx={{ borderRadius: 3, border: '1px solid #d8e3f0', overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 22px 58px -46px rgba(15,23,42,0.55)' }}>
            <Box sx={{ p: { xs: 2.25, md: 3 }, borderBottom: '1px solid #e7edf5' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>My Task List</Typography>
              <Typography variant="body2" color="text.secondary">Submit completed work or keep progress current for HOD review.</Typography>
            </Box>

            {subtasks.length === 0 ? (
              <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                  No active tasks assigned to you at the moment.
                </Alert>
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {subtasks.map((task) => {
                  const status = getStatusStyle(task.status);
                  const isLocked = ['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status);
                  return (
                    <Box key={task.id} sx={{ p: { xs: 2, md: 2.5 }, '&:hover': { bgcolor: '#f8fbff' } }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                        <Avatar sx={{ bgcolor: status.bg, color: status.color, width: 48, height: 48, flexShrink: 0 }}>
                          {['APPROVED_HOD', 'COMPLETED'].includes(task.status) ? <FactCheckRounded /> : <AssignmentRounded />}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>{task.title}</Typography>
                              <Typography variant="caption" color="primary" sx={{ fontWeight: 850 }}>
                                Assigned by HOD: {task.created_by_name || 'HOD'}
                              </Typography>
                            </Box>
                            <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 900, borderRadius: 1.5 }} />
                          </Stack>

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 2, whiteSpace: 'pre-line' }}>
                            {task.description}
                          </Typography>

                          <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CalendarMonthRounded sx={{ color: '#64748b', fontSize: 18 }} />
                                <Typography variant="caption" color="text.secondary">Due {formatDate(task.deadline)}</Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary">Parent task: {task.task_title || 'Department assignment'}</Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ mb: 2.25 }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: '#475569' }}>Work Completion</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 900, color: '#0f172a' }}>{task.progress || 0}%</Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={task.progress || 0} sx={{ height: 9, borderRadius: 5, bgcolor: '#e6edf5' }} />
                          </Box>

                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                            <Button
                              variant="contained"
                              startIcon={<CloudUploadRounded />}
                              onClick={() => handleOpenSubmit(task)}
                              disabled={isLocked}
                              sx={{ minWidth: 170, fontWeight: 850 }}
                            >
                              {task.status === 'SUBMITTED' ? 'Submitted' : task.status === 'APPROVED_HOD' ? 'Approved' : 'Submit Work'}
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<HistoryRounded />}
                              onClick={() => handleUpdateProgress(task.id, task.progress || 0)}
                              disabled={task.progress === 100 || isLocked}
                              sx={{ minWidth: 170, fontWeight: 850, bgcolor: '#ffffff' }}
                            >
                              Update Progress
                            </Button>
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2.5}>
            <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, border: '1px solid #c9ece8', bgcolor: '#ffffff', boxShadow: '0 22px 58px -48px rgba(15,23,42,0.55)' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 900, color: '#0f172a' }}>Progress Summary</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {completedCount} of {subtasks.length} assigned tasks are approved or completed.
              </Typography>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>Completion Rate</Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a' }}>{completionRate}%</Typography>
                <LinearProgress variant="determinate" value={completionRate} sx={{ mt: 1, height: 9, borderRadius: 5 }} />
              </Box>
            </Paper>

            <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, border: '1px solid #d8e3f0', bgcolor: '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>Next Action</Typography>
              <Typography variant="body2" color="text.secondary">
                {nextTask
                  ? `Continue "${nextTask.title}" or submit your completed work for HOD review.`
                  : subtasks.length
                    ? 'All available work is submitted or approved.'
                    : 'New assignments from your HOD will appear here.'}
              </Typography>
            </Paper>
          </Stack>
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
