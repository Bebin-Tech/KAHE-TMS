import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskDialog from '../components/CreateTaskDialog';
import ReviewSubmissionDialog from '../components/ReviewSubmissionDialog';
import TaskSuccessDialog from '../components/TaskSuccessDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  AddTaskRounded,
  ArrowForwardRounded,
  AssignmentOutlined,
  AssignmentRounded,
  AssignmentTurnedInOutlined,
  ErrorOutlineRounded,
  PendingActionsRounded,
  PriorityHighRounded,
  RateReviewRounded,
  SupervisorAccountRounded,
  TrendingUpRounded
} from '@mui/icons-material';
import api from '../api/axios';

const statusConfig = {
  COMPLETED: { label: 'Completed', color: '#0f766e', bg: '#ccfbf1' },
  DEAN_APPROVED: { label: 'Approved', color: '#0f766e', bg: '#ccfbf1' },
  ASSIGNED: { label: 'Assigned', color: '#2563eb', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'In Progress', color: '#8a6f00', bg: '#fff8d9' },
  SUBMITTED_HOD: { label: 'HOD Review', color: '#0f172a', bg: '#f1f5f9' },
  HOD_APPROVED: { label: 'HOD Approved', color: '#0f766e', bg: '#ccfbf1' },
  SUBMITTED_DEAN: { label: 'Dean Review', color: '#2563eb', bg: '#dbeafe' },
  REJECTED_DEAN: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' }
};

const formatDate = (date) => {
  if (!date) return 'Not scheduled';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getProgressValue = (task) => {
  if (['COMPLETED', 'DEAN_APPROVED'].includes(task.status)) return 100;
  if (task.status === 'SUBMITTED_DEAN') return 86;
  if (['HOD_APPROVED', 'SUBMITTED_HOD'].includes(task.status)) return 68;
  if (task.status === 'IN_PROGRESS') return 42;
  if (task.status === 'ASSIGNED') return 18;
  return 10;
};

const getFacultyProgress = (task) => {
  const subtasks = task.subtasks || [];
  if (!subtasks.length) {
    return { total: 0, complete: 0, submitted: 0, value: 0 };
  }

  const complete = subtasks.filter((subtask) => ['APPROVED_HOD', 'COMPLETED'].includes(subtask.status)).length;
  const submitted = subtasks.filter((subtask) => subtask.status === 'SUBMITTED').length;
  return {
    total: subtasks.length,
    complete,
    submitted,
    value: Math.round((complete / subtasks.length) * 100),
  };
};

const DeanDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [successTask, setSuccessTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('tasks/');
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 10000, !dialogOpen && !reviewOpen && !successTask);

  const taskTotals = useMemo(() => {
    const completed = tasks.filter((task) => ['COMPLETED', 'DEAN_APPROVED'].includes(task.status)).length;
    const pendingReview = tasks.filter((task) => task.status === 'SUBMITTED_DEAN').length;
    const overdue = tasks.filter((task) => task.deadline && new Date(task.deadline) < new Date() && !['COMPLETED', 'DEAN_APPROVED', 'CANCELLED'].includes(task.status)).length;
    const active = tasks.filter((task) => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_HOD', 'HOD_APPROVED', 'SUBMITTED_DEAN'].includes(task.status)).length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    return { completed, pendingReview, overdue, active, total: tasks.length, completionRate };
  }, [tasks]);

  const summaryCards = [
    {
      title: 'Total Tasks',
      value: taskTotals.total,
      helper: `${taskTotals.active} currently active`,
      icon: <AssignmentOutlined />,
      color: '#2563eb',
      bg: '#dbeafe'
    },
    {
      title: 'Dean Review',
      value: taskTotals.pendingReview,
      helper: 'Awaiting final decision',
      icon: <PendingActionsRounded />,
      color: '#0f172a',
      bg: '#f1f5f9'
    },
    {
      title: 'Completed',
      value: taskTotals.completed,
      helper: `${taskTotals.completionRate}% completion rate`,
      icon: <AssignmentTurnedInOutlined />,
      color: '#0f766e',
      bg: '#ccfbf1'
    },
    {
      title: 'Overdue',
      value: taskTotals.overdue,
      helper: 'Needs follow-up',
      icon: <ErrorOutlineRounded />,
      color: '#dc2626',
      bg: '#fee2e2'
    }
  ];

  const recentTasks = tasks.slice(0, 5);
  const reviewQueue = tasks.filter((task) => task.status === 'SUBMITTED_DEAN');
  const deadlineFocus = tasks
    .filter((task) => task.deadline && !['COMPLETED', 'DEAN_APPROVED', 'CANCELLED'].includes(task.status))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  const handleOpenReview = (task) => {
    setSelectedTask({ ...task, type: 'task' });
    setReviewOpen(true);
  };

  return (
    <DashboardLayout title="Dean Workspace">
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 2.25, sm: 3, md: 4 },
                minHeight: { xs: 220, sm: 240, md: 280 },
                borderRadius: 3,
                border: '1px solid #bfdbfe',
                color: '#0f172a',
                bgcolor: '#eff6ff',
                background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 54%, #dbeafe 100%)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 24px 62px -42px rgba(37,99,235,0.58), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 980, mx: 'auto', textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{ mb: 1, fontSize: { xs: '1.55rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.12, fontWeight: 800, color: '#0f172a' }}
                >
                  Karpagam Academy of Higher Education
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', fontWeight: 720 }}>
                  Welcome Back, Dean
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddTaskRounded />}
                    onClick={() => setDialogOpen(true)}
                    sx={{ width: { xs: '100%', sm: 'auto' }, bgcolor: 'white', borderColor: '#2563eb', boxShadow: '0 12px 28px -22px rgba(37,99,235,0.8)' }}
                  >
                    Create Task
                  </Button>
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForwardRounded />}
                    onClick={() => document.getElementById('dean-review-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    sx={{ width: { xs: '100%', sm: 'auto' }, bgcolor: 'white', borderColor: '#2563eb', boxShadow: '0 12px 28px -22px rgba(37,99,235,0.8)' }}
                  >
                    Review Flow
                  </Button>
                </Stack>
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', right: -70, bottom: -90, width: 300, height: 300, border: '44px solid rgba(37,99,235,0.18)', borderRadius: '50%' }} />
              <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: 92, top: 36, width: 116, height: 116, border: '22px solid rgba(15,118,110,0.18)', borderRadius: '50%' }} />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card
              sx={{
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                borderRadius: 3,
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 20px 52px -36px rgba(15,23,42,0.62)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 48, height: 48 }}>
                  {card.icon}
                </Avatar>
                <TrendingUpRounded sx={{ color: '#94a3b8', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 800 }}>{card.value}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 760, color: 'text.primary' }}>{card.title}</Typography>
              <Typography variant="body2" color="text.secondary">{card.helper}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} id="dean-review-flow">
        <Grid item xs={12} lg={7}>
          <Paper sx={{ borderRadius: 3, border: '1px solid #dde5f0', overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2.25, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, borderBottom: '1px solid #e7edf5' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Recent Task Flow</Typography>
                <Typography variant="body2" color="text.secondary">Latest assignments moving through Dean oversight.</Typography>
              </Box>
              <Chip label={`${taskTotals.pendingReview} for review`} sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 800 }} />
            </Box>
            <Stack divider={<Box sx={{ borderTop: '1px solid #edf2f7' }} />}>
              {(recentTasks.length ? recentTasks : [{ id: 'empty', title: loading ? 'Loading task activity...' : 'No tasks assigned yet', department_name: 'Create a task to begin tracking workflow', status: 'ASSIGNED' }]).map((task) => {
                const config = statusConfig[task.status] || statusConfig.ASSIGNED;
                const progress = getProgressValue(task);
                return (
                  <Box key={task.id} sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: config.bg, color: config.color }}>
                      {task.is_special ? <PriorityHighRounded /> : <AssignmentRounded />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 900 }}>{task.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{task.department_name || task.assigned_to_hod_name || 'Dean workflow'}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 1 }}>
                        <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 7, borderRadius: 5 }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>{progress}%</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                      <Chip label={config.label} size="small" sx={{ bgcolor: config.bg, color: config.color, fontWeight: 800, mb: 0.75 }} />
                      <Typography variant="caption" display="block" color="text.secondary">{formatDate(task.deadline)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, border: '1px solid #dde5f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>HOD Submissions</Typography>
                  <Typography variant="body2" color="text.secondary">Completed department work waiting for Dean review.</Typography>
                </Box>
                <RateReviewRounded sx={{ color: 'text.secondary' }} />
              </Box>
              {reviewQueue.length ? (
                <Stack spacing={2}>
                  {reviewQueue.map((task) => {
                    const config = statusConfig[task.status] || statusConfig.ASSIGNED;
                    const facultyProgress = getFacultyProgress(task);
                    return (
                      <Box key={task.id} sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{task.title}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {task.department_name || 'General'} | HOD: {task.assigned_to_hod_name || 'Unassigned'}
                            </Typography>
                          </Box>
                          <Chip label={config.label} size="small" sx={{ bgcolor: config.bg, color: config.color, fontWeight: 800 }} />
                        </Stack>

                        <Box sx={{ mt: 1.75 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                              Faculty completion
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 900 }}>
                              {facultyProgress.complete}/{facultyProgress.total} approved
                            </Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={facultyProgress.value || getProgressValue(task)} sx={{ height: 8, borderRadius: 5 }} />
                        </Box>

                        <Grid container spacing={1.25} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Created</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>{formatDate(task.created_at)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Due</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>{formatDate(task.deadline)}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" display="block">Progress</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>
                              {facultyProgress.total ? `${facultyProgress.total} Faculty task${facultyProgress.total === 1 ? '' : 's'} routed, ${facultyProgress.submitted} pending HOD review, ${facultyProgress.complete} verified.` : 'No Faculty subtasks recorded.'}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          startIcon={<RateReviewRounded />}
                          onClick={() => handleOpenReview(task)}
                          sx={{ mt: 1.75 }}
                        >
                          Open Final Review
                        </Button>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ py: 5, px: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <SupervisorAccountRounded sx={{ fontSize: 42, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>No HOD submissions yet</Typography>
                  <Typography variant="body2" color="text.secondary">Tasks submitted by HODs will appear here with status and progress details.</Typography>
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, border: '1px solid #dde5f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Deadline Focus</Typography>
                  <Typography variant="body2" color="text.secondary">Nearest active deadlines under Dean supervision.</Typography>
                </Box>
                <ErrorOutlineRounded sx={{ color: 'text.secondary' }} />
              </Box>
              <Stack spacing={2.25}>
                {(deadlineFocus.length ? deadlineFocus : [{ id: 'empty-deadline', title: 'No active deadlines', deadline: null, department_name: 'All clear' }]).map((task) => {
                  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                  return (
                    <Box key={task.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, gap: 2 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 900 }}>{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{task.department_name || task.assigned_to_hod_name || 'Dean workflow'}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: isOverdue ? 'error.main' : 'text.secondary', fontWeight: 900, whiteSpace: 'nowrap' }}>
                          {formatDate(task.deadline)}
                        </Typography>
                      </Box>
                      {task.deadline && (
                        <LinearProgress variant="determinate" value={isOverdue ? 100 : 62} sx={{ height: 8, borderRadius: 5 }} color={isOverdue ? 'error' : 'primary'} />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <CreateTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onTaskCreated={(savedTask, wasCreated) => {
          fetchData();
          if (wasCreated) setSuccessTask(savedTask);
        }}
      />

      <TaskSuccessDialog
        open={Boolean(successTask)}
        onClose={() => setSuccessTask(null)}
        taskTitle={successTask?.title}
      />

      {selectedTask && (
        <ReviewSubmissionDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          task={selectedTask}
          onProcessed={fetchData}
        />
      )}
    </DashboardLayout>
  );
};

export default DeanDashboard;
