import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateSubTaskDialog from '../components/CreateSubTaskDialog';
import ReviewSubmissionDialog from '../components/ReviewSubmissionDialog';
import {
  Grid, Paper, Typography, Box, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton,
  Card, CardContent, LinearProgress, Avatar
} from '@mui/material';
import {
  AssignmentRounded,
  AddRounded,
  MoreVertRounded,
  VisibilityRounded,
  GroupWorkRounded,
  TimerRounded,
  FactCheckRounded,
  RateReviewRounded
} from '@mui/icons-material';
import api from '../api/axios';

const HODDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, pendingReview: 0, teamPerformance: '92%' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);

  const fetchData = async () => {
    try {
      const [taskRes, subRes] = await Promise.all([
        api.get('tasks/'),
        api.get('subtasks/')
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReview = (item, type) => {
    setReviewTask({ ...item, type });
    setReviewOpen(true);
  };

  const handleOpenSubTaskDialog = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
        <Box sx={{
          p: 2, borderRadius: '12px',
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, letterSpacing: '-1px' }}>Department Management</Typography>
        <Typography variant="body1" color="text.secondary">Monitor and assign tasks to your faculty members.</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }} justifyContent="center">
        <Grid item xs={12} md={4}>
          <StatCard title="Assigned Tasks" value={stats.assigned} icon={<AssignmentRounded />} color="#3b82f6" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Sub-Tasks Active" value={14} icon={<GroupWorkRounded />} color="#8b5cf6" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Pending Review" value={stats.pendingReview} icon={<FactCheckRounded />} color="#10b981" />
        </Grid>
      </Grid>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} lg={12} sx={{ mb: 3 }}>
          <Paper sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Main Tasks from Dean</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
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
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddRounded />}
                          onClick={() => handleOpenSubTaskDialog(task)}
                          sx={{ mr: 1 }}
                        >
                          Add Sub-Task
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={task.status === 'SUBMITTED_DEAN' || task.status === 'COMPLETED'}
                          onClick={async () => {
                            await api.post(`tasks/${task.id}/submit_to_dean/`);
                            fetchData();
                          }}
                        >
                          Submit to Dean
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">My Assigned Tasks</Typography>
              <Button size="small" variant="outlined" sx={{ borderRadius: '8px' }}>View All</Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
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
          <Paper sx={{ borderRadius: '20px', p: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Department Activity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.light' }}>F</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Faculty {i} updated progress</Typography>
                    <Typography variant="caption" color="text.secondary">"Finalizing the report for CS Dept Task"</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: 'text.secondary' }}>
                      <TimerRounded sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                      <Typography variant="caption">2 hours ago</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
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
    </DashboardLayout>
  );
};

export default HODDashboard;
