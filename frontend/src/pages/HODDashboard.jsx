import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  VisibilityRounded,
  GroupWorkRounded,
  TimerRounded,
  FactCheckRounded,
  RateReviewRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const HODDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, pendingReview: 0, teamPerformance: '92%' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [submitTask, setSubmitTask] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
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
      const [taskRes, subRes] = await Promise.all([
        api.get('tasks/', requestConfig),
        api.get('subtasks/', requestConfig)
      ]);
      setTasks(taskRes.data);
      setSubtasks(subRes.data);
      setStats({
        assigned: taskRes.data.length,
        pendingReview: subRes.data.filter(t => t.status === 'SUBMITTED').length,
        teamPerformance: '88%'
      });
    } catch (err) {
      console.error('Error fetching HOD data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 10000, !dialogOpen && !reviewOpen && !submitTask);

  const handleOpenReview = (item, type) => {
    setReviewTask({ ...item, type });
    setReviewOpen(true);
  };

  const handleOpenSubTaskDialog = (task) => {
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
      await api.post(`tasks/${submitTask.id}/submit_to_dean/`, {
        content: submissionContent || 'Completed task submitted by HOD for Dean review.'
      });
      setSubmitTask(null);
      setSubmissionContent('');
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
  const recentActivity = useMemo(() => (
    [...subtasks]
      .sort((first, second) => second.id - first.id)
      .slice(0, 3)
      .map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        faculty: subtask.assigned_to_name || 'Faculty',
        status: subtask.status?.replaceAll('_', ' ') || 'Assigned',
      }))
  ), [subtasks]);

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
                  {tasks.map((task) => (
                    <TableRow key={task.id} hover>
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
                        {['ASSIGNED', 'REJECTED_DEAN'].includes(task.status) && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleStartWork(task)}
                          >
                            Start Work
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddRounded />}
                          onClick={() => handleOpenSubTaskDialog(task)}
                        >
                          Add Sub-Task
                        </Button>
                        <Tooltip title={!canSubmitToDean(task) ? 'Assign Faculty and approve all submitted Faculty work before submitting to Dean.' : ''}>
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={['SUBMITTED_DEAN', 'COMPLETED', 'DEAN_APPROVED'].includes(task.status) || !canSubmitToDean(task)}
                              onClick={() => {
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: { xs: 2.25, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Faculty Work Queue</Typography>
                <Typography variant="body2" color="text.secondary">Sub-tasks assigned and returned by faculty.</Typography>
              </Box>
              <Button size="small" variant="outlined" sx={{ borderRadius: '8px', alignSelf: { xs: 'flex-start', sm: 'center' } }}>View All</Button>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 680 }}>
                <TableHead sx={{ bgcolor: '#f4f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Faculty Task</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subtasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">Assigned by: {task.created_by_name || 'HOD'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.light' }}>
                            {task.assigned_to_name?.[0]}
                          </Avatar>
                          <Typography variant="caption" sx={{ ml: 1, fontWeight: 600 }}>{task.assigned_to_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status}
                          size="small"
                          color={task.status === 'SUBMITTED' ? 'warning' : task.status === 'COMPLETED' ? 'success' : 'default'}
                          sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {task.status === 'SUBMITTED' ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<RateReviewRounded />}
                            onClick={() => handleOpenReview(task, 'subtask')}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Review
                          </Button>
                        ) : (
                          <IconButton size="small"><VisibilityRounded fontSize="small" /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ borderRadius: 2, p: { xs: 2.25, md: 3 }, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 900 }}>Department Activity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
                <Box key={activity.id} sx={{ display: 'flex', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.light' }}>{activity.faculty[0]}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{activity.faculty}</Typography>
                    <Typography variant="caption" color="text.secondary">{activity.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: 'text.secondary' }}>
                      <TimerRounded sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                      <Typography variant="caption">{activity.status}</Typography>
                    </Box>
                  </Box>
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">
                  No faculty activity recorded yet.
                </Typography>
              )}
            </Box>
            <Button fullWidth variant="text" sx={{ mt: 4 }}>See All Activity</Button>
          </Paper>
        </Grid>
      </Grid>

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
        onClose={() => setSubmitTask(null)}
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
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSubmitTask(null)} color="inherit">Cancel</Button>
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

