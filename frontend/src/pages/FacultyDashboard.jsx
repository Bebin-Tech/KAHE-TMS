import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SubmitWorkDialog from '../components/SubmitWorkDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Grid, Paper, Typography, Box, Button,
  Chip, LinearProgress, CircularProgress, Alert, Stack, Avatar, Snackbar
} from '@mui/material';
import {
  CloudUploadRounded,
  HistoryRounded,
  CheckCircleRounded,
  AssignmentRounded,
  PendingActionsRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  const completedCount = subtasks.filter((task) => ['APPROVED_HOD', 'COMPLETED'].includes(task.status)).length;
  const submittedCount = subtasks.filter((task) => task.status === 'SUBMITTED').length;
  const activeCount = subtasks.length - completedCount;

  return (
    <DashboardLayout title="My Assignments">
      <Paper elevation={0} sx={{ mb: 3, p: { xs: 2.5, md: 3 }, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ color: '#237dba', fontWeight: 900 }}>Faculty workspace</Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Assigned work queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update progress, attach completed work, and monitor HOD review status.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip icon={<AssignmentRounded />} label={`${activeCount} active`} sx={{ bgcolor: '#eaf3ff', color: '#237dba', fontWeight: 900 }} />
            <Chip icon={<PendingActionsRounded />} label={`${submittedCount} submitted`} sx={{ bgcolor: '#fff8d9', color: '#8a6f00', fontWeight: 900 }} />
            <Chip icon={<CheckCircleRounded />} label={`${completedCount} approved`} sx={{ bgcolor: '#e8f7f6', color: '#1f7f79', fontWeight: 900 }} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center">
        <Grid item xs={12} md={8}>
          {subtasks.length === 0 ? (
            <Alert severity="info" variant="outlined" sx={{ borderRadius: '16px' }}>
              No active tasks assigned to you at the moment.
            </Alert>
          ) : (
            subtasks.map((task) => (
              <Paper key={task.id} sx={{ p: { xs: 2, md: 3 }, mb: { xs: 2, md: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
                    <Avatar sx={{ bgcolor: '#eaf3ff', color: '#237dba', width: 42, height: 42 }}>
                      <AssignmentRounded />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{task.title}</Typography>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>Assigned by HOD: {task.created_by_name}</Typography>
                    </Box>
                  </Box>
                  <Chip label={task.status} size="small" color="primary" sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', sm: 'center' } }} />
                </Box>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>{task.description}</Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Work Completion</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{task.progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={task.progress} sx={{ height: 10, borderRadius: 5 }} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CloudUploadRounded />}
                    onClick={() => handleOpenSubmit(task)}
                    disabled={['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status)}
                  >
                    {task.status === 'SUBMITTED' ? 'Submitted' : task.status === 'APPROVED_HOD' ? 'Approved' : 'Submit Work'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HistoryRounded />}
                    onClick={() => handleUpdateProgress(task.id, task.progress)}
                    disabled={task.progress === 100}
                  >
                    Update Progress
                  </Button>
                </Box>
              </Paper>
            ))
          )}
        </Grid>

        <Grid item xs={12} md={4}>
           <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 2, border: '1px solid #c9ece8', bgcolor: '#ffffff', height: '100%' }}>
             <Typography variant="h6" sx={{ mb: 1, fontWeight: 900 }}>Progress Summary</Typography>
             <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
               {completedCount} of {subtasks.length} assigned tasks are approved or completed.
             </Typography>
             <Stack spacing={2.25}>
               <Box>
                 <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary' }}>Completion Rate</Typography>
                 <Typography variant="h4" sx={{ fontWeight: 900 }}>{subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : 0}%</Typography>
                 <LinearProgress variant="determinate" value={subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : 0} sx={{ mt: 1, height: 8, borderRadius: 5 }} />
               </Box>
               <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f6f6f7', border: '1px solid #e5e2df' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Next action</Typography>
                  <Typography variant="body2" color="text.secondary">Submit completed work or update progress before HOD review.</Typography>
               </Box>
             </Stack>
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
