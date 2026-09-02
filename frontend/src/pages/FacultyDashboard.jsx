import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SubmitWorkDialog from '../components/SubmitWorkDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import TextAnimate from '../components/TextAnimate';
import StatCard from '../components/StatCard';
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
  TrendingUpRounded,
  AccessTimeRounded,
  AssignmentTurnedInOutlined
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const statusStyles = {
  ASSIGNED: { label: 'Assigned', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  IN_PROGRESS: { label: 'In Progress', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  SUBMITTED: { label: 'HOD Review', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  APPROVED_HOD: { label: 'Approved', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  COMPLETED: { label: 'Completed', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  REJECTED_HOD: { label: 'Rework', bg: '#fef2f2', color: '#b91c1c', border: '#fecdd3' },
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
      <DashboardLayout title="My Assignments">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={36} thickness={4} />
        </Box>
      </DashboardLayout>
    );
  }

  const completedCount = subtasks.filter((task) => ['APPROVED_HOD', 'COMPLETED'].includes(task.status)).length;
  const submittedCount = subtasks.filter((task) => task.status === 'SUBMITTED').length;
  const activeCount = subtasks.filter((task) => !['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status)).length;
  const progressAverage = subtasks.length
    ? Math.round(subtasks.reduce((total, task) => total + Number(task.progress || 0), 0) / subtasks.length)
    : 0;

  const summaryCards = [
    {
      title: 'Total Assignments',
      value: subtasks.length,
      helper: `${activeCount} tasks currently in progress`,
      icon: <AssignmentRounded />,
      color: '#2563eb',
      bg: '#eff6ff',
      borderColor: 'rgba(37,99,235,0.22)',
      glow: 'rgba(37,99,235,0.12)',
      badge: {
        label: 'Assigned',
        bg: '#eff6ff',
        color: '#1d4ed8',
        borderColor: 'rgba(37,99,235,0.2)'
      }
    },
    {
      title: 'Active Work',
      value: activeCount,
      helper: 'Ongoing tasks requiring action',
      icon: <TrendingUpRounded />,
      color: '#7c3aed',
      bg: '#f5f3ff',
      borderColor: 'rgba(124,58,237,0.22)',
      glow: 'rgba(124,58,237,0.12)',
      badge: {
        label: 'In Progress',
        bg: '#f5f3ff',
        color: '#6d28d9',
        borderColor: 'rgba(124,58,237,0.2)'
      }
    },
    {
      title: 'Waiting Review',
      value: submittedCount,
      helper: submittedCount > 0 ? 'Submitted for HOD verification' : 'No submissions pending',
      icon: <PendingActionsRounded />,
      color: '#d97706',
      bg: '#fffbeb',
      borderColor: 'rgba(217,119,6,0.22)',
      glow: 'rgba(217,119,6,0.12)',
      badge: {
        label: submittedCount > 0 ? 'In Review' : 'Up to Date',
        bg: submittedCount > 0 ? '#fef3c7' : '#f0fdf4',
        color: submittedCount > 0 ? '#b45309' : '#15803d',
        borderColor: submittedCount > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(22,163,74,0.2)'
      }
    },
    {
      title: 'Approved & Done',
      value: completedCount,
      helper: `${progressAverage}% overall work completion rate`,
      icon: <CheckCircleRounded />,
      color: '#059669',
      bg: '#ecfdf5',
      borderColor: 'rgba(5,150,105,0.22)',
      glow: 'rgba(5,150,105,0.12)',
      progress: progressAverage,
      badge: {
        label: `${progressAverage}% Done`,
        bg: '#ecfdf5',
        color: '#047857',
        borderColor: 'rgba(5,150,105,0.2)'
      }
    }
  ];

  return (
    <DashboardLayout title="My Assignments">
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3, md: 3.5 },
          borderRadius: 3,
          border: '1px solid #b7d5fb',
          bgcolor: '#eaf3ff',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 55%, #e8f7f6 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 24px 62px -46px rgba(37,99,235,0.58), inset 0 1px 0 rgba(255,255,255,0.9)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="overline" sx={{ color: '#1d4ed8', fontWeight: 900, letterSpacing: 1.2 }}>
                <TextAnimate delay={0.1} stagger={0.035}>Faculty Workspace</TextAnimate>
              </Typography>
              <Typography variant="h4" sx={{ mb: 0.75, fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.65rem', sm: '2.2rem' }, lineHeight: 1.15 }}>
                <TextAnimate delay={0.35}>Assigned Work Queue</TextAnimate>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680, fontWeight: 500, lineHeight: 1.6 }}>
                Review assigned departmental tasks, update completion progress, and submit deliverables for HOD verification.
              </Typography>
            </Box>
            <Stack
              direction={{ xs: 'row', sm: 'row' }}
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              sx={{ flexShrink: 0, gap: 1 }}
            >
              <Chip
                icon={<AssignmentRounded sx={{ fontSize: '1rem !important', color: '#1d4ed8 !important' }} />}
                label={`${activeCount} Active`}
                sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 800, borderRadius: '999px', border: '1px solid #bfdbfe' }}
              />
              <Chip
                icon={<PendingActionsRounded sx={{ fontSize: '1rem !important', color: '#b45309 !important' }} />}
                label={`${submittedCount} In Review`}
                sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, borderRadius: '999px', border: '1px solid #fde68a' }}
              />
              <Chip
                icon={<CheckCircleRounded sx={{ fontSize: '1rem !important', color: '#047857 !important' }} />}
                label={`${completedCount} Approved`}
                sx={{ bgcolor: '#d1fae5', color: '#047857', fontWeight: 800, borderRadius: '999px', border: '1px solid #a7f3d0' }}
              />
            </Stack>
          </Stack>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', right: -58, bottom: -76, width: 250, height: 250, border: '38px solid rgba(59,143,243,0.18)', borderRadius: '50%' }} />
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: 84, top: 32, width: 96, height: 96, border: '18px solid rgba(52,177,170,0.18)', borderRadius: '50%' }} />
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <StatCard {...card} />
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
              <Box sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '16px',
                    bgcolor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px -12px rgba(37,99,235,0.35)'
                  }}
                >
                  <AssignmentTurnedInOutlined sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                  No active tasks assigned
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 440, mx: 'auto', lineHeight: 1.6 }}>
                  You are all caught up! When your Head of Department assigns new tasks or academic deliverables, they will appear here in real-time.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.75} sx={{ p: { xs: 2, md: 2.5 } }}>
                {subtasks.map((task) => {
                  const status = getStatusStyle(task.status);
                  const isLocked = ['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status);
                  return (
                    <Paper
                      key={task.id}
                      elevation={0}
                      sx={{
                        p: { xs: 2, md: 2.5 },
                        borderRadius: 3,
                        border: '1px solid #dbe7f5',
                        bgcolor: '#ffffff',
                        boxShadow: '0 16px 40px -36px rgba(15,23,42,0.45)',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          bgcolor: '#fbfdff',
                          borderColor: '#bfdbfe',
                          boxShadow: '0 22px 48px -36px rgba(37,99,235,0.35)',
                        },
                      }}
                    >
                      <Grid container spacing={2.5} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <Stack direction="row" spacing={1.75} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '14px',
                                bgcolor: status.bg,
                                color: status.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${status.border}`,
                                flexShrink: 0,
                                '& svg': { fontSize: '1.45rem' }
                              }}
                            >
                              {['APPROVED_HOD', 'COMPLETED'].includes(task.status) ? <FactCheckRounded /> : <AssignmentRounded />}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 850, color: '#0f172a', lineHeight: 1.25, fontSize: '1.05rem' }}>
                                  {task.title}
                                </Typography>
                                <Chip
                                  label={status.label}
                                  size="small"
                                  sx={{
                                    bgcolor: status.bg,
                                    color: status.color,
                                    fontWeight: 800,
                                    borderRadius: '999px',
                                    border: `1px solid ${status.border}`,
                                    fontSize: '0.725rem'
                                  }}
                                />
                              </Stack>
                              <Typography variant="caption" sx={{ color: '#2563eb', display: 'block', fontWeight: 750 }}>
                                Assigned by HOD: {task.created_by_name || 'HOD'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-line', fontSize: '0.85rem' }}>
                                {task.description || 'No description provided.'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Stack spacing={1.25}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#475569' }}>
                              <CalendarMonthRounded sx={{ fontSize: 18, color: '#64748b' }} />
                              <Typography variant="body2" sx={{ fontWeight: 750, color: '#334155' }}>
                                Due {formatDate(task.deadline)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 750, color: '#64748b' }}>Work Completion</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: '#0f172a' }}>{task.progress || 0}%</Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={task.progress || 0}
                              sx={{
                                height: 7,
                                borderRadius: 4,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: (task.progress || 0) >= 100 ? '#059669' : '#2563eb',
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.1} alignItems="stretch">
                            <Button
                              variant="contained"
                              startIcon={<CloudUploadRounded />}
                              onClick={() => handleOpenSubmit(task)}
                              disabled={isLocked}
                              sx={{
                                fontWeight: 800,
                                borderRadius: '10px',
                                textTransform: 'none',
                                bgcolor: '#2563eb',
                                '&:hover': { bgcolor: '#1d4ed8' }
                              }}
                            >
                              {task.status === 'SUBMITTED' ? 'Submitted' : task.status === 'APPROVED_HOD' ? 'Approved' : 'Submit Work'}
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<HistoryRounded />}
                              onClick={() => handleUpdateProgress(task.id, task.progress || 0)}
                              disabled={task.progress === 100 || isLocked}
                              sx={{
                                fontWeight: 800,
                                borderRadius: '10px',
                                textTransform: 'none',
                                bgcolor: '#ffffff',
                                borderColor: '#cbd5e1',
                                color: '#334155',
                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }
                              }}
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
