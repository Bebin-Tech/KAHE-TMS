import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ReviewSubmissionDialog from '../components/ReviewSubmissionDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Grid, Paper, Typography, Box, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton,
  Card, CardContent, Avatar,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import {
  AssignmentRounded,
  VisibilityRounded,
  GroupWorkRounded,
  TimerRounded,
  FactCheckRounded,
  RateReviewRounded
} from '@mui/icons-material';
import api from '../api/axios';

const HODDashboard = () => {
  const [subtasks, setSubtasks] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, pendingReview: 0, teamPerformance: '92%' });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const fetchData = useCallback(async () => {
    try {
      const [taskRes, subRes] = await Promise.all([
        api.get('tasks/'),
        api.get('subtasks/')
      ]);
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

  useAutoRefresh(fetchData, 10000, !reviewOpen);

  const handleOpenReview = (item, type) => {
    setReviewTask({ ...item, type });
    setReviewOpen(true);
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

      {reviewTask && (
        <ReviewSubmissionDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          task={reviewTask}
          onProcessed={fetchData}
        />
      )}
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

