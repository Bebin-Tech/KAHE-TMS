import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskDialog from '../components/CreateTaskDialog';
import CreateSubTaskDialog from '../components/CreateSubTaskDialog';
import ReviewSubmissionDialog from '../components/ReviewSubmissionDialog';
import TaskSuccessDialog from '../components/TaskSuccessDialog';
import {
  Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Avatar, Snackbar, Alert,
  Card, Dialog, DialogTitle, DialogContent, DialogActions, Grid, LinearProgress, TextField, Stack
} from '@mui/material';
import {
  AddRounded,
  AssignmentOutlined,
  EditRounded,
  DeleteRounded,
  StarRounded,
  ScheduleRounded,
  CheckCircleRounded,
  CancelRounded,
  VisibilityRounded,
  PlayArrowRounded,
  FlagRounded,
  AttachFileRounded,
  AssignmentTurnedInOutlined,
  ErrorOutlineRounded,
  PendingActionsRounded,
  RateReviewRounded,
  SendRounded,
  TrendingUpRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';
import { formatApiError } from '../utils/errors';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';
const fileBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
const getFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${fileBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const activeHodStatuses = ['ASSIGNED', 'IN_PROGRESS', 'REJECTED_DEAN', 'SUBMITTED_HOD', 'HOD_APPROVED'];
const filterActiveHodTasks = (rows) => (
  (rows || []).filter((task) => activeHodStatuses.includes(task.status))
);

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
  if (!subtasks.length) return { total: 0, complete: 0, submitted: 0, value: 0 };

  const complete = subtasks.filter((subtask) => ['APPROVED_HOD', 'COMPLETED'].includes(subtask.status)).length;
  const submitted = subtasks.filter((subtask) => subtask.status === 'SUBMITTED').length;
  return {
    total: subtasks.length,
    complete,
    submitted,
    value: Math.round((complete / subtasks.length) * 100),
  };
};

const Tasks = () => {
  const currentRole = getCurrentSession()?.role;
  const isHod = currentRole === 'HOD';
  const isDean = currentRole === 'DEAN';
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [facultyAssignmentTask, setFacultyAssignmentTask] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successTask, setSuccessTask] = useState(null);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const showMessage = (message, severity = 'success') => {
    setNotification({ open: true, severity, message });
  };

  const fetchData = useCallback(async () => {
    try {
      const requestConfig = {
        params: { refresh: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      };
      if (isDean) {
        const res = await api.get('tasks/', requestConfig);
        if (res.data?.length) {
          setTasks(res.data);
          return;
        }

        const workflowRes = await api.get('tasks/dean-workflow/', requestConfig);
        setTasks(workflowRes.data);
        return;
      }

      if (!isHod) {
        const res = await api.get('tasks/', requestConfig);
        setTasks(res.data);
        return;
      }

      const assignedResponse = await api.get('tasks/assigned-to-me/', requestConfig);
      if (assignedResponse.data?.length) {
        setTasks(assignedResponse.data);
        return;
      }

      const fallbackResponse = await api.get('tasks/', requestConfig);
      setTasks(filterActiveHodTasks(fallbackResponse.data));
    } catch (err) {
      console.error('Error fetching tasks:', err);
      if (isDean) {
        try {
          const workflowRes = await api.get('tasks/dean-workflow/', {
            params: { refresh: Date.now() },
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          });
          setTasks(workflowRes.data);
        } catch (fallbackErr) {
          console.error('Error fetching fallback Dean tasks:', fallbackErr);
        }
      } else if (isHod) {
        try {
          const fallbackResponse = await api.get('tasks/', {
            params: { refresh: Date.now() },
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          });
          setTasks(filterActiveHodTasks(fallbackResponse.data));
        } catch (fallbackErr) {
          console.error('Error fetching fallback HOD tasks:', fallbackErr);
        }
      }
    }
  }, [isDean, isHod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (task) => {
    setEditingTask(task);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`tasks/${deleteTarget.id}/`);
      setDeleteTarget(null);
      showMessage('Task deleted successfully.');
      fetchData();
    } catch (err) {
      console.error('Error deleting task:', err);
      showMessage(formatApiError(err, 'Failed to delete task.'), 'error');
    }
  };

  const handleStartWork = async (task) => {
    setActionLoading(true);
    try {
      await api.patch(`tasks/${task.id}/`, { status: 'IN_PROGRESS' });
      showMessage('Task status updated to In Progress.');
      await fetchData();
      setSelectedTask((current) => (current?.id === task.id ? { ...current, status: 'IN_PROGRESS' } : current));
    } catch (err) {
      showMessage(formatApiError(err, 'Failed to start the task.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSubmitToDean = (task) => {
    setSubmitTarget(task);
    setSubmissionRemarks('');
  };

  const handleSubmitToDean = async () => {
    if (!submitTarget) return;

    setActionLoading(true);
    try {
      await api.post(`tasks/${submitTarget.id}/submit_to_dean/`, {
        content: submissionRemarks || 'Verified faculty work submitted by HOD for Dean final review.',
      });
      showMessage('Task submitted to Dean for final review.');
      setSubmitTarget(null);
      setSubmissionRemarks('');
      setSelectedTask(null);
      await fetchData();
    } catch (err) {
      showMessage(formatApiError(err, 'Failed to complete the task.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignFaculty = (task) => {
    setFacultyAssignmentTask(task);
  };

  const handleReviewFacultyWork = (subtask) => {
    setReviewTask({ ...subtask, type: 'subtask' });
    setReviewOpen(true);
  };

  const handleReviewDeanSubmission = (task) => {
    setReviewTask({ ...task, type: 'task' });
    setReviewOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleRounded sx={{ color: '#1f7f79', fontSize: '1rem' }} />;
      case 'CANCELLED': return <CancelRounded sx={{ color: '#ef4444', fontSize: '1rem' }} />;
      default: return <ScheduleRounded sx={{ color: '#237dba', fontSize: '1rem' }} />;
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      'ONGOING': { bg: '#eaf3ff', color: '#237dba' },
      'ASSIGNED': { bg: '#eaf3ff', color: '#237dba' },
      'IN_PROGRESS': { bg: '#fff8d9', color: '#8a6f00' },
      'SUBMITTED_DEAN': { bg: '#eaf3ff', color: '#237dba' },
      'DEAN_APPROVED': { bg: '#e8f7f6', color: '#1f7f79' },
      'REJECTED_DEAN': { bg: '#fef2f2', color: '#b91c1c' },
      'CANCELLED': { bg: '#fef2f2', color: '#b91c1c' },
      'COMPLETED': { bg: '#e8f7f6', color: '#1f7f79' }
    };
    const labels = {
      ONGOING: 'Ongoing',
      ASSIGNED: 'Assigned',
      IN_PROGRESS: 'In Progress',
      SUBMITTED_DEAN: 'Dean Review',
      DEAN_APPROVED: 'Verified',
      REJECTED_DEAN: 'Rejected',
      CANCELLED: 'Cancelled',
      COMPLETED: 'Completed',
    };
    const style = colors[status] || colors['ONGOING'];
    return (
      <Chip
        label={labels[status] || status}
        size="small"
        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, borderRadius: '8px', fontSize: '0.75rem' }}
      />
    );
  };

  const getPriorityChip = (priority, isSpecial) => {
    const priorityStyles = {
      LOW: { bg: '#e8f7f6', color: '#1f7f79', label: 'Low' },
      MEDIUM: { bg: '#eaf3ff', color: '#237dba', label: 'Medium' },
      HIGH: { bg: '#fff8d9', color: '#8a6f00', label: 'High' },
      URGENT: { bg: '#fff0ef', color: '#c2413b', label: 'Urgent' },
    };
    const style = isSpecial ? { bg: '#fff8d9', color: '#8a6f00', label: 'Special' } : (priorityStyles[priority] || priorityStyles.MEDIUM);
    return (
      <Chip
        icon={isSpecial ? <StarRounded /> : <FlagRounded />}
        label={style.label}
        size="small"
        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 850, borderRadius: '8px', '& .MuiChip-icon': { color: style.color } }}
      />
    );
  };

  const visibleTasks = tasks;
  const taskTotals = useMemo(() => {
    const completed = tasks.filter((task) => ['COMPLETED', 'DEAN_APPROVED'].includes(task.status)).length;
    const pendingReview = tasks.filter((task) => task.status === 'SUBMITTED_DEAN').length;
    const overdue = tasks.filter((task) => task.deadline && new Date(task.deadline) < new Date() && !['COMPLETED', 'DEAN_APPROVED', 'CANCELLED'].includes(task.status)).length;
    const active = tasks.filter((task) => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_HOD', 'HOD_APPROVED', 'SUBMITTED_DEAN', 'REJECTED_DEAN'].includes(task.status)).length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    return { completed, pendingReview, overdue, active, total: tasks.length, completionRate };
  }, [tasks]);

  const deanSummaryCards = [
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
      title: 'Verified',
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

  const canStartTask = (task) => ['ASSIGNED', 'REJECTED_DEAN'].includes(task.status);
  const hasFacultyTasks = (task) => (task.subtasks || []).length > 0;
  const hasSubmittedFacultyWork = (task) => (task.subtasks || []).some((subtask) => subtask.status === 'SUBMITTED');
  const canSubmitToDean = (task) => (
    hasFacultyTasks(task)
    && (task.subtasks || []).every((subtask) => ['APPROVED_HOD', 'COMPLETED'].includes(subtask.status))
    && !['COMPLETED', 'DEAN_APPROVED', 'CANCELLED', 'SUBMITTED_DEAN'].includes(task.status)
  );

  return (
    <DashboardLayout title="Task Management">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: { xs: 'stretch', md: 'center' } }}>
        {!isHod && (
          <Button
            variant="outlined"
            startIcon={<AddRounded />}
            onClick={() => setOpen(true)}
            sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' }, bgcolor: '#ffffff', borderColor: '#b7d5fb', fontWeight: 850, borderRadius: 1.5 }}
          >
            Create New Task
          </Button>
        )}
      </Box>

      {isDean && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {deanSummaryCards.map((card) => (
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

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={7}>
              <Paper sx={{ borderRadius: 3, border: '1px solid #dde5f0', overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: { xs: 2.25, md: 3 }, borderBottom: '1px solid #e7edf5' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Recent Task Flow</Typography>
                  <Typography variant="body2" color="text.secondary">Latest assignments moving through Dean oversight.</Typography>
                </Box>
                <Stack divider={<Box sx={{ borderTop: '1px solid #edf2f7' }} />}>
                  {(recentTasks.length ? recentTasks : [{ id: 'empty-recent', title: 'No tasks assigned yet', department_name: 'Create a task to begin tracking workflow', status: 'ASSIGNED', deadline: null }]).map((task) => {
                    const progress = getProgressValue(task);
                    return (
                      <Box key={task.id} sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: task.is_special ? '#fff8d9' : '#eaf3ff', color: task.is_special ? '#8a6f00' : '#237dba' }}>
                          {task.is_special ? <StarRounded /> : <AssignmentOutlined />}
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
                          {getStatusChip(task.status)}
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>{formatDate(task.deadline)}</Typography>
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
                  <Stack spacing={2}>
                    {reviewQueue.length ? reviewQueue.map((task) => {
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
                            {getStatusChip(task.status)}
                          </Stack>
                          <Box sx={{ mt: 1.75 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>Faculty completion</Typography>
                              <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 900 }}>
                                {facultyProgress.complete}/{facultyProgress.total} approved
                              </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={facultyProgress.value || getProgressValue(task)} sx={{ height: 8, borderRadius: 5 }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.25 }}>
                            Due {formatDate(task.deadline)}
                          </Typography>
                          <Button
                            fullWidth
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<RateReviewRounded />}
                            onClick={() => handleReviewDeanSubmission(task)}
                            sx={{ mt: 1.75 }}
                          >
                            Final Review
                          </Button>
                        </Box>
                      );
                    }) : (
                      <Box sx={{ py: 5, px: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                        <RateReviewRounded sx={{ fontSize: 42, color: '#94a3b8', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>No HOD submissions yet</Typography>
                        <Typography variant="body2" color="text.secondary">Tasks submitted by HODs will appear here with status and progress details.</Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>

                <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, border: '1px solid #dde5f0' }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Deadline Focus</Typography>
                    <Typography variant="body2" color="text.secondary">Nearest active deadlines under Dean supervision.</Typography>
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
                            <LinearProgress variant="determinate" value={isOverdue ? 100 : getProgressValue(task)} sx={{ height: 8, borderRadius: 5 }} color={isOverdue ? 'error' : 'primary'} />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </>
      )}

      <TableContainer component={Paper} sx={{ border: '1px solid #d8e3f0', borderRadius: 3, overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 20px 54px -42px rgba(15,23,42,0.45)' }}>
        {isHod && (
          <Box sx={{ p: { xs: 2.25, md: 3 }, borderBottom: '1px solid #e7edf5', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>Dean Assignments</Typography>
            <Typography variant="body2" color="text.secondary">Primary tasks routed to this department.</Typography>
          </Box>
        )}
        <Table sx={{ minWidth: 760 }}>
          <TableHead sx={{ bgcolor: '#f8fbff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Task Details</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Assignee</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Timeline</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleTasks.length > 0 ? visibleTasks.map((task) => (
              <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fbff' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: task.is_special ? '#fff8d9' : '#eaf3ff', color: task.is_special ? '#8a6f00' : '#237dba', width: 44, height: 44 }}>
                      <AssignmentOutlined />
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                          {task.title}
                        </Typography>
                        {task.is_special && (
                          <Tooltip title="Special Task">
                            <StarRounded sx={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                          </Tooltip>
                        )}
                        {isHod && getPriorityChip(task.priority, task.is_special)}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.description}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.assigned_to_hod_name || 'Unassigned'}</Typography>
                  <Typography variant="caption" color="text.secondary">{task.department_name || 'General'}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#637381' }}>
                      Start: {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#237dba' }}>
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(task.status)}
                    {getStatusChip(task.status)}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {isHod ? (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" startIcon={<VisibilityRounded />} onClick={() => setSelectedTask(task)}>
                        Open
                      </Button>
                      {canStartTask(task) && (
                        <Button size="small" variant="outlined" startIcon={<PlayArrowRounded />} disabled={actionLoading} onClick={() => handleStartWork(task)}>
                          Start
                        </Button>
                      )}
                      <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={() => handleAssignFaculty(task)}>
                        Add Sub-Task
                      </Button>
                      <Tooltip title={!canSubmitToDean(task) ? 'Assign Faculty and approve submitted Faculty work before sending this task to Dean.' : ''}>
                        <span>
                          <Button size="small" variant="contained" startIcon={<SendRounded />} disabled={actionLoading || !canSubmitToDean(task)} onClick={() => handleOpenSubmitToDean(task)}>
                            Submit Dean
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                      {isDean && (
                        <Button size="small" variant="outlined" startIcon={<VisibilityRounded />} onClick={() => setSelectedTask(task)}>
                          Open
                        </Button>
                      )}
                      {isDean && task.status === 'SUBMITTED_DEAN' && (
                        <Button size="small" variant="contained" color="success" startIcon={<RateReviewRounded />} onClick={() => handleReviewDeanSubmission(task)}>
                          Final Review
                        </Button>
                      )}
                      <IconButton onClick={() => handleEdit(task)} size="small" sx={{ color: '#237dba' }}><EditRounded fontSize="small" /></IconButton>
                      <IconButton onClick={() => setDeleteTarget(task)} size="small" sx={{ color: '#f44336' }}><DeleteRounded fontSize="small" /></IconButton>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <AssignmentOutlined sx={{ fontSize: 48, color: '#919eab', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {isDean ? 'No Dean-created tasks found in the Task module.' : ''}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateTaskDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingTask(null);
        }}
        onTaskCreated={(savedTask, wasCreated) => {
          fetchData();
          if (wasCreated) setSuccessTask(savedTask);
        }}
        task={editingTask}
      />
      <TaskSuccessDialog
        open={Boolean(successTask)}
        onClose={() => setSuccessTask(null)}
        taskTitle={successTask?.title}
      />
      <Dialog open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Task Details</DialogTitle>
        <DialogContent dividers>
          {selectedTask && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', flex: 1 }}>{selectedTask.title}</Typography>
                  {getPriorityChip(selectedTask.priority, selectedTask.is_special)}
                  {getStatusChip(selectedTask.status)}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{selectedTask.description}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Department</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.department_name || 'General'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Assigned By</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.created_by_name || 'Dean'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Start Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleString() : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Due Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleString() : 'N/A'}</Typography>
              </Grid>
              {selectedTask.attachment && (
                <Grid item xs={12}>
                  <Button variant="outlined" startIcon={<AttachFileRounded />} href={getFileUrl(selectedTask.attachment)} target="_blank" rel="noreferrer" download>
                    Open / Download Attachment
                  </Button>
                </Grid>
              )}
              {selectedTask.subtasks?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Faculty Sub-Tasks</Typography>
                  <Stack spacing={1}>
                    {selectedTask.subtasks.map((subtask) => (
                      <Box key={subtask.id} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>{subtask.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {subtask.assigned_to_name || 'Faculty'} - {subtask.status}
                            </Typography>
                          </Box>
                          {subtask.status === 'SUBMITTED' && (
                            <Button size="small" variant="contained" color="warning" startIcon={<RateReviewRounded />} onClick={() => handleReviewFacultyWork(subtask)}>
                              Review
                            </Button>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setSelectedTask(null)} color="inherit">Close</Button>
          {isHod && selectedTask && canStartTask(selectedTask) && (
            <Button variant="outlined" startIcon={<PlayArrowRounded />} disabled={actionLoading} onClick={() => handleStartWork(selectedTask)}>
              Start Work
            </Button>
          )}
          {isHod && selectedTask && (
            <Button variant="outlined" startIcon={<AddRounded />} onClick={() => handleAssignFaculty(selectedTask)}>
              Assign Faculty
            </Button>
          )}
          {isHod && selectedTask && hasSubmittedFacultyWork(selectedTask) && (
            <Button variant="outlined" color="warning" startIcon={<RateReviewRounded />} onClick={() => handleReviewFacultyWork(selectedTask.subtasks.find((subtask) => subtask.status === 'SUBMITTED'))}>
              Review Faculty Work
            </Button>
          )}
          {isHod && selectedTask && (
            <Tooltip title={!canSubmitToDean(selectedTask) ? 'All Faculty sub-tasks must be approved before submitting to Dean.' : ''}>
              <span>
                <Button variant="contained" startIcon={<SendRounded />} disabled={actionLoading || !canSubmitToDean(selectedTask)} onClick={() => handleOpenSubmitToDean(selectedTask)}>
                  Submit to Dean
                </Button>
              </span>
            </Tooltip>
          )}
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(submitTarget)} onClose={() => setSubmitTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Submit Task to Dean</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add verification remarks before returning this task to the Dean for final review and completion.
          </Typography>
          <TextField
            fullWidth
            label="HOD Verification Remarks"
            multiline
            minRows={4}
            value={submissionRemarks}
            onChange={(event) => setSubmissionRemarks(event.target.value)}
            placeholder="Summarize the verified Faculty work and any remarks for Dean..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSubmitTarget(null)} color="inherit">Cancel</Button>
          <Button variant="contained" startIcon={<SendRounded />} disabled={actionLoading} onClick={handleSubmitToDean}>
            Submit to Dean
          </Button>
        </DialogActions>
      </Dialog>
      {facultyAssignmentTask && (
        <CreateSubTaskDialog
          open={Boolean(facultyAssignmentTask)}
          onClose={() => setFacultyAssignmentTask(null)}
          taskId={facultyAssignmentTask.id}
          taskDepartmentId={facultyAssignmentTask.department}
          onTaskCreated={async () => {
            showMessage('Task assigned to Faculty successfully.');
            setFacultyAssignmentTask(null);
            setSelectedTask(null);
            await fetchData();
          }}
        />
      )}
      {reviewTask && (
        <ReviewSubmissionDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          task={reviewTask}
          onProcessed={async () => {
            showMessage(reviewTask.type === 'task' ? 'Dean review completed successfully.' : 'Faculty work reviewed successfully.');
            setReviewTask(null);
            setReviewOpen(false);
            setSelectedTask(null);
            await fetchData();
          }}
        />
      )}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {`Delete "${deleteTarget?.title || 'this task'}"? It will no longer appear in active task lists.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
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

export default Tasks;

