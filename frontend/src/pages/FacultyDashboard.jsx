import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SubmitWorkDialog from '../components/SubmitWorkDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Grid, Paper, Typography, Box, Button,
  Chip, LinearProgress, CircularProgress, Alert
} from '@mui/material';
import {
  CloudUploadRounded,
  HistoryRounded,
  CheckCircleRounded
} from '@mui/icons-material';
import api from '../api/axios';

const FacultyDashboard = () => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      alert("Failed to update progress");
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <DashboardLayout title="My Assignments">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, fontSize: { xs: '1.45rem', sm: '2.125rem' } }}>My Work Console</Typography>
        <Typography variant="body1" color="text.secondary">Manage your assigned tasks and report progress.</Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8}>
          {subtasks.length === 0 ? (
            <Alert severity="info" variant="outlined" sx={{ borderRadius: '16px' }}>
              No active tasks assigned to you at the moment.
            </Alert>
          ) : (
            subtasks.map((task) => (
              <Paper key={task.id} sx={{ p: 3, mb: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{task.title}</Typography>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>Assigned by HOD: {task.created_by_name}</Typography>
                  </Box>
                  <Chip label={task.status} size="small" color="primary" sx={{ fontWeight: 700 }} />
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
                    variant="contained"
                    startIcon={<CloudUploadRounded />}
                    onClick={() => handleOpenSubmit(task)}
                    disabled={['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'].includes(task.status)}
                  >
                    {task.status === 'SUBMITTED' ? 'Submitted' : task.status === 'APPROVED_HOD' ? 'Approved' : 'Submit Work'}
                  </Button>
                  <Button
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
           <Paper sx={{ p: 3, borderRadius: '20px', bgcolor: 'primary.main', color: 'white' }}>
             <Typography variant="h6" sx={{ mb: 1 }}>Performance Summary</Typography>
             <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>You have completed {subtasks.filter(t => t.progress === 100).length} tasks this month.</Typography>
             <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>A+</Typography>
                <Typography variant="caption">Efficiency Rating</Typography>
             </Box>
           </Paper>
        </Grid>
      </Grid>
      <SubmitWorkDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        subtaskId={selectedTask?.id}
        onSubmitted={fetchData}
      />
    </DashboardLayout>
  );
};

export default FacultyDashboard;
