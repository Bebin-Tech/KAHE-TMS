import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskDialog from '../components/CreateTaskDialog';
import ReviewSubmissionDialog from '../components/ReviewSubmissionDialog';
import {
  Grid, Paper, Typography, Box, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton,
  InputBase, Card, CardContent, LinearProgress, Tooltip
} from '@mui/material';
import {
  AddRounded,
  AssignmentRounded,
  CheckCircleRounded,
  PendingActionsRounded,
  ErrorOutlineRounded,
  SearchRounded,
  FilterListRounded,
  MoreVertRounded,
  VisibilityRounded,
  RateReviewRounded
} from '@mui/icons-material';
import api from '../api/axios';

const DeanDashboard = () => {
  const [stats, setStats] = useState({
    total: 0, pending: 0, completed: 0, overdue: 0
  });
  const [tasks, setTasks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchData = async () => {
    try {
      const response = await api.get('tasks/');
      setTasks(response.data);
      setStats({
        total: response.data.length,
        pending: response.data.filter(t => t.status === 'SUBMITTED_DEAN').length,
        completed: response.data.filter(t => ['COMPLETED', 'DEAN_APPROVED'].includes(t.status)).length,
        overdue: response.data.filter(t => new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReview = (task) => {
    setSelectedTask({ ...task, type: 'task' });
    setReviewOpen(true);
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <Card sx={{ height: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: '12px',
            bgcolor: `${color}15`,
            color: color
          }}>
            {icon}
          </Box>
          {trend && (
            <Chip
              label={trend}
              size="small"
              sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {value}
        </Typography>
      </CardContent>
      <Box sx={{ height: '4px', bgcolor: color, position: 'absolute', bottom: 0, width: '100%' }} />
    </Card>
  );

  const getStatusChip = (status) => {
    const configs = {
      'ASSIGNED': { color: '#3b82f6', bg: '#eff6ff', label: 'Assigned' },
      'IN_PROGRESS': { color: '#f59e0b', bg: '#fffbe6', label: 'In Progress' },
      'SUBMITTED_HOD': { color: '#8b5cf6', bg: '#f5f3ff', label: 'HOD Review' },
      'HOD_APPROVED': { color: '#10b981', bg: '#ecfdf5', label: 'HOD Approved' },
      'SUBMITTED_DEAN': { color: '#06b6d4', bg: '#ecfeff', label: 'Dean Review' },
      'DEAN_APPROVED': { color: '#059669', bg: '#f0fdf4', label: 'Completed' },
      'REJECTED_DEAN': { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
      'COMPLETED': { color: '#059669', bg: '#f0fdf4', label: 'Completed' },
    };
    const config = configs[status] || configs['ASSIGNED'];
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bg,
          color: config.color,
          fontWeight: 700,
          borderRadius: '8px'
        }}
      />
    );
  };

  return (
    <DashboardLayout title="Overview">
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1, letterSpacing: '-1px' }}>
              Welcome back, Dean
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here is what's happening in the system today.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            sx={{ px: 3, py: 1.5, borderRadius: '12px' }}
            onClick={() => setDialogOpen(true)}
          >
            Create New Task
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Tasks" value={stats.total} icon={<AssignmentRounded />} color="#3b82f6" trend="+12%" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pending Review" value={stats.pending} icon={<PendingActionsRounded />} color="#8b5cf6" trend="+3 today" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Completed" value={stats.completed} icon={<CheckCircleRounded />} color="#10b981" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Overdue" value={stats.overdue} icon={<ErrorOutlineRounded />} color="#ef4444" />
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Recent Task Assignments</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.default',
              px: 2, py: 1,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'divider',
              width: { xs: '150px', sm: '250px' }
            }}>
              <SearchRounded sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
              <InputBase
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ fontSize: '0.9rem', width: '100%' }}
              />
            </Box>
            <IconButton sx={{ bgcolor: 'background.default', borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
              <FilterListRounded />
            </IconButton>
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Task Details</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Assigned HOD</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Deadline</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length > 0 ? tasks.map((task) => (
                <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{
                        width: 40, height: 40,
                        borderRadius: '10px',
                        bgcolor: task.priority === 'HIGH' ? '#fef2f2' : '#eff6ff',
                        color: task.priority === 'HIGH' ? '#ef4444' : '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2
                      }}>
                        <AssignmentRounded sx={{ fontSize: '1.2rem' }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{
                          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {task.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', mr: 1, bgcolor: 'secondary.light' }}>
                        {task.assigned_to_hod_name?.[0]}
                      </Avatar>
                      <Typography variant="body2">{task.assigned_to_hod_name || 'N/A'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ width: '150px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={45}
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>45%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: new Date(task.deadline) < new Date() ? 'error.main' : 'text.secondary',
                      fontWeight: 600
                    }}>
                      {new Date(task.deadline) < new Date() ? 'Overdue' : 'Scheduled'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(task.status)}
                  </TableCell>
                  <TableCell align="right">
                    {task.status === 'SUBMITTED_DEAN' ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<RateReviewRounded />}
                        onClick={() => handleOpenReview(task)}
                      >
                        Final Review
                      </Button>
                    ) : (
                      <>
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: 'primary.main', mr: 1 }}>
                            <VisibilityRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small">
                          <MoreVertRounded fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                      <AssignmentRounded sx={{ fontSize: '3rem', mb: 2 }} />
                      <Typography variant="h6">No tasks found</Typography>
                      <Typography variant="body2">Try creating a new task to get started.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CreateTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onTaskCreated={fetchData}
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
