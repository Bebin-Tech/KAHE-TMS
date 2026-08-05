import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateSubTaskDialog from '../components/CreateSubTaskDialog';
import ReviewSubmissionDialog from '../components/ReviewSubmissionDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Grid, Paper, Typography, Box, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton,
  Card, CardContent, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress,
  Tooltip,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import {
  AssignmentRounded,
  AddRounded,
  AttachFileRounded,
  VisibilityRounded,
  GroupWorkRounded,
  FactCheckRounded,
  RateReviewRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/';
const fileBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
const submittedToDeanStatuses = ['SUBMITTED_DEAN', 'COMPLETED', 'DEAN_APPROVED'];
const facultyStatusStyles = {
  ASSIGNED: { label: 'Assigned', bg: '#eaf3ff', color: '#1d4ed8', border: '#bfdbfe' },
  IN_PROGRESS: { label: 'In Progress', bg: '#fff8d9', color: '#8a6f00', border: '#fde68a' },
  SUBMITTED: { label: 'Submitted', bg: '#fff3df', color: '#b45309', border: '#fed7aa' },
  APPROVED_HOD: { label: 'Approved', bg: '#e8f7f6', color: '#0f766e', border: '#99f6e4' },
  COMPLETED: { label: 'Completed', bg: '#e8f7f6', color: '#0f766e', border: '#99f6e4' },
  REJECTED_HOD: { label: 'Rework', bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
};

const getFacultyStatusStyle = (status) => (
  facultyStatusStyles[status] || {
    label: status?.replaceAll('_', ' ') || 'Pending',
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
  }
);

const getSubmitToDeanButtonSx = (status) => {
  const isSubmitted = submittedToDeanStatuses.includes(status);
  const color = isSubmitted ? '#991b1b' : '#065f46';
  const bg = isSubmitted ? 'rgba(239, 68, 68, 0.14)' : 'rgba(34, 197, 94, 0.14)';
  const hoverBg = isSubmitted ? 'rgba(239, 68, 68, 0.22)' : 'rgba(34, 197, 94, 0.22)';
  const border = isSubmitted ? 'rgba(239, 68, 68, 0.65)' : 'rgba(34, 197, 94, 0.65)';
  const disabledBorder = isSubmitted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(34, 197, 94, 0.45)';
  const disabledColor = isSubmitted ? '#991b1b' : '#065f46';

  return {
    background: `${bg} !important`,
    bgcolor: `${bg} !important`,
    backgroundColor: `${bg} !important`,
    color: `${color} !important`,
    WebkitTextFillColor: `${color} !important`,
    border: `1px solid ${border}`,
    boxShadow: 'none !important',
    opacity: '1 !important',
    fontWeight: 900,
    textTransform: 'none',
    '&:hover': {
      background: `${hoverBg} !important`,
      bgcolor: `${hoverBg} !important`,
      backgroundColor: `${hoverBg} !important`,
      boxShadow: 'none !important',
    },
    '&.Mui-disabled': {
      background: `${bg} !important`,
      bgcolor: `${bg} !important`,
      backgroundColor: `${bg} !important`,
      color: `${disabledColor} !important`,
      WebkitTextFillColor: `${disabledColor} !important`,
      border: `1px solid ${disabledBorder}`,
      opacity: '1 !important',
    },
  };
};
const getFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    if (!import.meta.env.VITE_API_BASE_URL) {
      try {
        const url = new URL(path);
        return `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return path;
      }
    }
    return path;
  }
  return `${fileBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const HODDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, pendingReview: 0, teamPerformance: '92%' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [submitTask, setSubmitTask] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionAttachment, setSubmissionAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const fetchData = useCallback(async () => {
    try {
      const requestConfig = {
        params: { refresh: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      };
      const [assignedTaskRes, fallbackTaskRes, subRes] = await Promise.allSettled([
        api.get('tasks/assigned-to-me/', requestConfig),
        api.get('tasks/', requestConfig),
        api.get('subtasks/', requestConfig)
      ]);
      const assignedData = assignedTaskRes.status === 'fulfilled' ? assignedTaskRes.value.data : [];
      const fallbackData = fallbackTaskRes.status === 'fulfilled' ? fallbackTaskRes.value.data : [];
      const subtaskData = subRes.status === 'fulfilled' ? subRes.value.data : [];
      const assignedTasks = assignedData?.length ? assignedData : fallbackData;
      setTasks(assignedTasks);
      setSubtasks(subtaskData);
      setStats({
        assigned: assignedTasks.length,
        pendingReview: subtaskData.filter(t => t.status === 'SUBMITTED').length,
        teamPerformance: '88%'
      });
    } catch (err) {
      console.error('Error fetching HOD data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 1000, !dialogOpen && !reviewOpen && !submitTask && !detailTask);

  const handleOpenReview = (item, type) => {
    setReviewTask({ ...item, type });
    setReviewOpen(true);
  };

  const handleOpenSubTaskDialog = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleAssignFromDetails = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleStartWork = async (task) => {
    try {
      await api.patch(`tasks/${task.id}/`, { status: 'IN_PROGRESS' });
      fetchData();
    } catch (err) {
      console.error('Error starting task:', err);
    }
  };

  const handleSubmitToDean = async () => {
    if (!submitTask) return;
    setSubmitting(true);
    try {
      const requestData = new FormData();
      requestData.append('content', submissionContent || 'Completed task submitted by HOD for Dean review.');
      if (submissionAttachment) {
        requestData.append('attachment', submissionAttachment);
      }

      await api.post(`tasks/${submitTask.id}/submit_to_dean/`, requestData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitTask(null);
      setSubmissionContent('');
      setSubmissionAttachment(null);
      fetchData();
    } catch (err) {
      console.error('Error submitting task to Dean:', err);
      setNotification({
        open: true,
        severity: 'error',
        message: formatApiError(err, 'Failed to submit task to Dean.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTaskSubtasks = (taskId) => subtasks.filter((subtask) => subtask.task === taskId);

  const canSubmitToDean = (task) => {
    const taskSubtasks = getTaskSubtasks(task.id);
    return taskSubtasks.length > 0 && taskSubtasks.every((subtask) => ['APPROVED_HOD', 'COMPLETED'].includes(subtask.status));
  };

  const activeSubtasks = subtasks.filter((subtask) => !['APPROVED_HOD', 'COMPLETED'].includes(subtask.status)).length;

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: '0 16px 38px -32px rgba(30,30,44,0.5)' }}>
      <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center' }}>
        <Box sx={{
          p: 1.5, borderRadius: 2,
          bgcolor: `${color}15`, color: color, mr: 2
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Department Overview">
      <Paper elevation={0} sx={{ mb: 3, p: { xs: 2.5, md: 3 }, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ color: '#1f7f79', fontWeight: 900 }}>HOD command center</Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Department task control
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign faculty work, validate submissions, and prepare completed tasks for Dean review.
            </Typography>
          </Box>
          <Chip label={`${stats.pendingReview} pending reviews`} sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, bgcolor: '#fff8d9', color: '#8a6f00', fontWeight: 900 }} />
        </Stack>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard title="Assigned Tasks" value={stats.assigned} icon={<AssignmentRounded />} color="#2563eb" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Sub-Tasks Active" value={activeSubtasks} icon={<GroupWorkRounded />} color="#0f172a" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Pending Review" value={stats.pendingReview} icon={<FactCheckRounded />} color="#34B1AA" />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center">
        <Grid item xs={12} lg={12} sx={{ mb: 3 }}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: { xs: 2.25, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Dean Assignments</Typography>
                <Typography variant="body2" color="text.secondary">Primary tasks routed to this department.</Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 780 }}>
                <TableHead sx={{ bgcolor: '#f4f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Task Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Deadline</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.length > 0 ? tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      hover
                      onClick={() => setDetailTask(task)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">Assigned by Dean: {task.created_by_name}</Typography>
                      </TableCell>
                      <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={task.status} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityRounded />}
                            onClick={(event) => {
                              event.stopPropagation();
                              setDetailTask(task);
                            }}
                          >
                            View
                          </Button>
                        {['ASSIGNED', 'REJECTED_DEAN'].includes(task.status) && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStartWork(task);
                            }}
                          >
                            Start Work
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddRounded />}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenSubTaskDialog(task);
                          }}
                        >
                          Add Sub-Task
                        </Button>
                        <Tooltip title={!canSubmitToDean(task) ? 'Assign Faculty and approve all submitted Faculty work before submitting to Dean.' : ''}>
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              sx={getSubmitToDeanButtonSx(task.status)}
                              disabled={submittedToDeanStatuses.includes(task.status) || !canSubmitToDean(task)}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSubmitTask(task);
                                setSubmissionContent('');
                              }}
                            >
                              Submit to Dean
                            </Button>
                          </span>
                        </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          No Dean assignments found for this HOD yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid #d8e3f0',
              bgcolor: '#ffffff',
              boxShadow: '0 22px 58px -46px rgba(15,23,42,0.55)',
            }}
          >
            <Box
              sx={{
                p: { xs: 2.25, md: 3 },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1.5,
                flexDirection: { xs: 'column', sm: 'row' },
                borderBottom: '1px solid #e7edf5',
                bgcolor: '#ffffff',
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, fontSize: { xs: '1.25rem', md: '1.45rem' }, color: '#0f172a' }}>
                  Faculty Work Queue
                </Typography>
                <Typography variant="body2" sx={{ color: '#53657d', mt: 0.35 }}>
                  Sub-tasks assigned and returned by faculty.
                </Typography>
              </Box>
              <Chip
                label={`${subtasks.length} faculty tasks`}
                sx={{ bgcolor: '#eef6ff', color: '#1d4ed8', fontWeight: 900, borderRadius: 1.5 }}
              />
            </Box>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead sx={{ bgcolor: '#f8fbff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, color: '#334155', letterSpacing: '0.04em' }}>FACULTY TASK</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: '#334155', letterSpacing: '0.04em' }}>ASSIGNED TO</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: '#334155', letterSpacing: '0.04em' }}>STATUS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#334155', letterSpacing: '0.04em' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subtasks.length > 0 ? subtasks.map((task) => {
                    const statusStyle = getFacultyStatusStyle(task.status);

                    return (
                    <TableRow
                      key={task.id}
                      hover
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': { bgcolor: '#f8fbff' },
                      }}
                    >
                      <TableCell sx={{ py: 2.15 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>{task.title}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Assigned by: {task.created_by_name || 'HOD'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 900 }}>
                            {(task.assigned_to_name?.[0] || 'F').toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 850, color: '#0f172a' }}>{task.assigned_to_name || 'Faculty'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusStyle.label}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            minWidth: 94,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {task.status === 'SUBMITTED' ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RateReviewRounded />}
                            onClick={() => handleOpenReview(task, 'subtask')}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 900,
                              borderRadius: 1.5,
                              color: '#b45309',
                              borderColor: '#f59e0b',
                              bgcolor: '#fff7ed',
                              '&:hover': { bgcolor: '#ffedd5', borderColor: '#d97706' },
                            }}
                          >
                            Review
                          </Button>
                        ) : (
                          <Tooltip title="View task">
                            <IconButton
                              size="small"
                              sx={{
                                width: 36,
                                height: 36,
                                border: '1px solid #d8e3f0',
                                color: '#475569',
                                bgcolor: '#ffffff',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#1d4ed8' },
                              }}
                            >
                              <VisibilityRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 7 }}>
                        <FactCheckRounded sx={{ fontSize: 42, color: '#94a3b8', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                          No faculty work assigned yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          Faculty sub-tasks will appear here after assignment.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Dean Assignment Details</DialogTitle>
        <DialogContent dividers>
          {detailTask && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>
                      {detailTask.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assigned by Dean: {detailTask.created_by_name || 'Dean'}
                    </Typography>
                  </Box>
                  <Chip label={detailTask.status?.replaceAll('_', ' ') || 'Assigned'} sx={{ fontWeight: 900 }} />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fbff' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>TASK DESCRIPTION</Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: 'pre-line', color: '#334155' }}>
                    {detailTask.description || 'No description provided.'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Department</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{detailTask.department_name || 'General'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Priority</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{detailTask.is_special ? 'Special' : detailTask.priority || 'Medium'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Start Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {detailTask.start_date ? new Date(detailTask.start_date).toLocaleString() : 'Not recorded'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Deadline</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {detailTask.deadline ? new Date(detailTask.deadline).toLocaleString() : 'Not scheduled'}
                </Typography>
              </Grid>

              {detailTask.attachment && (
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileRounded />}
                    href={getFileUrl(detailTask.attachment)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    sx={{ bgcolor: '#ffffff', fontWeight: 850 }}
                  >
                    Open / Download Attachment
                  </Button>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Faculty Sub-Tasks</Typography>
                <Stack spacing={1}>
                  {getTaskSubtasks(detailTask.id).length > 0 ? getTaskSubtasks(detailTask.id).map((subtask) => (
                    <Box key={subtask.id} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>{subtask.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subtask.assigned_to_name || 'Faculty'} - {subtask.status?.replaceAll('_', ' ') || 'Assigned'}
                          </Typography>
                        </Box>
                        {subtask.status === 'SUBMITTED' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<RateReviewRounded />}
                            onClick={() => handleOpenReview(subtask, 'subtask')}
                          >
                            Review
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  )) : (
                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                      No Faculty sub-tasks have been assigned yet. Create a sub-task after reviewing this Dean assignment.
                    </Alert>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setDetailTask(null)} color="inherit">Close</Button>
          {detailTask && ['ASSIGNED', 'REJECTED_DEAN'].includes(detailTask.status) && (
            <Button variant="outlined" onClick={() => handleStartWork(detailTask)}>
              Start Work
            </Button>
          )}
          {detailTask && (
            <Button variant="outlined" startIcon={<AddRounded />} onClick={() => handleAssignFromDetails(detailTask)}>
              Assign Faculty Sub-Task
            </Button>
          )}
          {detailTask && (
            <Tooltip title={!canSubmitToDean(detailTask) ? 'All Faculty sub-tasks must be approved before submitting to Dean.' : ''}>
              <span>
                <Button
                  variant="contained"
                  sx={getSubmitToDeanButtonSx(detailTask.status)}
                  disabled={submittedToDeanStatuses.includes(detailTask.status) || !canSubmitToDean(detailTask)}
                  onClick={() => {
                    setSubmitTask(detailTask);
                    setSubmissionContent('');
                  }}
                >
                  Submit to Dean
                </Button>
              </span>
            </Tooltip>
          )}
        </DialogActions>
      </Dialog>

      {selectedTask && (
        <CreateSubTaskDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          taskId={selectedTask.id}
          taskDepartmentId={selectedTask.department}
          onTaskCreated={fetchData}
        />
      )}
      {reviewTask && (
        <ReviewSubmissionDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          task={reviewTask}
          onProcessed={fetchData}
        />
      )}
      <Dialog
        open={Boolean(submitTask)}
        onClose={() => {
          setSubmitTask(null);
          setSubmissionAttachment(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Task to Dean</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add the final HOD summary. Verified Faculty submissions are retained with the task and can be reviewed by the Dean.
          </Typography>
          <TextField
            fullWidth
            label="Final Submission Summary"
            multiline
            minRows={4}
            value={submissionContent}
            onChange={(e) => setSubmissionContent(e.target.value)}
            placeholder="Summarize the completed work and corrections made..."
          />
          <Box sx={{ mt: 2.5 }}>
            <input
              hidden
              id="hod-final-submission-attachment"
              type="file"
              onChange={(event) => setSubmissionAttachment(event.target.files?.[0] || null)}
            />
            <label htmlFor="hod-final-submission-attachment">
              <Button
                component="span"
                variant="outlined"
                startIcon={<AttachFileRounded />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {submissionAttachment ? submissionAttachment.name : 'Attach supporting file'}
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Add PDFs, images, documents, spreadsheets, presentations, text, or ZIP files for Dean review.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setSubmitTask(null);
              setSubmissionAttachment(null);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitToDean}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit to Dean'}
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

export default HODDashboard;

