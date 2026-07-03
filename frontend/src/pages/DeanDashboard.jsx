import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskDialog from '../components/CreateTaskDialog';
import ReviewSubmissionDialog from '../components/ReviewSubmissionDialog';
import TaskSuccessDialog from '../components/TaskSuccessDialog';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Grid, Paper, Typography, Box, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton,
  InputBase, Card, CardContent, LinearProgress, Tooltip, Avatar, Stack
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
  const [successTask, setSuccessTask] = useState(null);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 10000, !dialogOpen && !reviewOpen && !successTask);

  const handleOpenReview = (task) => {
    setSelectedTask({ ...task, type: 'task' });
    setReviewOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [task.title, task.assigned_to_hod_name, task.department_name, task.status]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const StatCard = ({ title, value, icon, color, trend }) => (
    <Card sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', position: 'relative', boxShadow: '0 16px 38px -32px rgba(30,30,44,0.5)' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${color}15`,
            color: color
          }}>
            {icon}
          </Box>
          {trend && (
            <Chip
              label={trend}
              size="small"
              sx={{ bgcolor: '#e8f7f6', color: '#1f7f79', fontWeight: 700, fontSize: '0.7rem' }}
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
      'ASSIGNED': { color: '#237dba', bg: '#eaf3ff', label: 'Assigned' },
      'IN_PROGRESS': { color: '#8a6f00', bg: '#fff8d9', label: 'In Progress' },
      'SUBMITTED_HOD': { color: '#0f172a', bg: '#f1f5f9', label: 'HOD Review' },
      'HOD_APPROVED': { color: '#1f7f79', bg: '#e8f7f6', label: 'HOD Approved' },
      'SUBMITTED_DEAN': { color: '#237dba', bg: '#eaf3ff', label: 'Dean Review' },
      'DEAN_APPROVED': { color: '#1f7f79', bg: '#e8f7f6', label: 'Completed' },
      'REJECTED_DEAN': { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
      'COMPLETED': { color: '#1f7f79', bg: '#e8f7f6', label: 'Completed' },
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
    <DashboardLayout title="Dean Workspace">
      <Paper elevation={0} sx={{ mb: 3, p: { xs: 2.5, md: 3 }, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ color: '#237dba', fontWeight: 900 }}>Dean oversight</Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Institutional task review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track HOD submissions, final approvals, and deadline risk across departments.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setDialogOpen(true)}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' }, minWidth: 180 }}
          >
            Create Task
          </Button>
        </Stack>
      </Paper>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Tasks" value={stats.total} icon={<AssignmentRounded />} color="#2563eb" trend="+12%" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pending Review" value={stats.pending} icon={<PendingActionsRounded />} color="#0f172a" trend="+3 today" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Completed" value={stats.completed} icon={<CheckCircleRounded />} color="#34B1AA" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Overdue" value={stats.overdue} icon={<ErrorOutlineRounded />} color="#ef4444" />
          </Grid>
        </Grid>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Review Queue</Typography>
            <Typography variant="body2" color="text.secondary">Recent assignments and HOD submissions awaiting action.</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.default',
              px: 2, py: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              width: { xs: '100%', sm: '250px' },
              minWidth: 0
            }}>
              <SearchRounded sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
              <InputBase
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ fontSize: '0.9rem', width: '100%' }}
              />
            </Box>
            <IconButton sx={{ bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <FilterListRounded />
            </IconButton>
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f4f9ff' }}>
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
              {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{
                        width: 40, height: 40,
                        borderRadius: '10px',
                        bgcolor: task.priority === 'HIGH' ? '#fef2f2' : '#eaf3ff',
                        color: task.priority === 'HIGH' ? '#ef4444' : '#237dba',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2
                      }}>
                        <AssignmentRounded sx={{ fontSize: '1.2rem' }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>Assigned to HOD: {task.assigned_to_hod_name}</Typography>
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

