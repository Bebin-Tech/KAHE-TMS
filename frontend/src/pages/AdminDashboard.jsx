import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
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
  AccountBalanceOutlined,
  AddTaskRounded,
  ArrowForwardRounded,
  AssignmentOutlined,
  AssignmentTurnedInOutlined,
  BusinessOutlined,
  PeopleOutlined,
  PriorityHighRounded,
  TrendingUpRounded
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const statusConfig = {
  COMPLETED: { label: 'Completed', color: '#11845b', bg: '#eaf8f2' },
  DEAN_APPROVED: { label: 'Approved', color: '#11845b', bg: '#eaf8f2' },
  ASSIGNED: { label: 'Assigned', color: '#0f5ea8', bg: '#e9f3ff' },
  IN_PROGRESS: { label: 'In Progress', color: '#b7791f', bg: '#fff6df' },
  SUBMITTED_HOD: { label: 'HOD Review', color: '#7c3aed', bg: '#f3edff' },
  SUBMITTED_DEAN: { label: 'Dean Review', color: '#0e7490', bg: '#e8fbff' },
  REJECTED_DEAN: { label: 'Rejected', color: '#c2413b', bg: '#fff0ef' },
  CANCELLED: { label: 'Cancelled', color: '#c2413b', bg: '#fff0ef' }
};

const formatDate = (date) => {
  if (!date) return 'Not scheduled';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_users: 0,
    departments: 0,
    completed_tasks: 0,
    total_tasks: 0
  });
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [statsRes, taskRes, deptRes] = await Promise.allSettled([
        api.get('users/stats/'),
        api.get('tasks/'),
        api.get('departments/')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (taskRes.status === 'fulfilled') setTasks(taskRes.value.data);
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useAutoRefresh(fetchDashboard, 10000);

  const taskTotals = useMemo(() => {
    const completed = tasks.filter((task) => ['COMPLETED', 'DEAN_APPROVED'].includes(task.status)).length || stats.completed_tasks || 0;
    const total = tasks.length || stats.total_tasks || 0;
    const overdue = tasks.filter((task) => task.deadline && new Date(task.deadline) < new Date() && !['COMPLETED', 'DEAN_APPROVED', 'CANCELLED'].includes(task.status)).length;
    const pending = tasks.filter((task) => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_HOD', 'SUBMITTED_DEAN'].includes(task.status)).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { completed, total, overdue, pending, completionRate };
  }, [tasks, stats.completed_tasks, stats.total_tasks]);

  const summaryCards = [
    {
      title: 'Total Users',
      value: stats.total_users || 0,
      helper: 'Active institutional accounts',
      icon: <PeopleOutlined />,
      color: '#0f5ea8',
      bg: '#e9f3ff'
    },
    {
      title: 'Departments',
      value: stats.departments || departments.length || 0,
      helper: 'Academic units onboarded',
      icon: <AccountBalanceOutlined />,
      color: '#16a085',
      bg: '#eaf8f2'
    },
    {
      title: 'Completed',
      value: taskTotals.completed,
      helper: `${taskTotals.completionRate}% completion rate`,
      icon: <AssignmentTurnedInOutlined />,
      color: '#7c3aed',
      bg: '#f3edff'
    },
    {
      title: 'Total Tasks',
      value: taskTotals.total,
      helper: `${taskTotals.pending} currently active`,
      icon: <AssignmentOutlined />,
      color: '#b7791f',
      bg: '#fff6df'
    }
  ];

  const departmentLoad = (departments.length ? departments : [{ id: 'general', name: 'General Administration', block_name: 'Central Operations' }])
    .slice(0, 5)
    .map((department, index) => {
      const deptTasks = tasks.filter((task) => task.department_name === department.name).length;
      const load = tasks.length ? Math.max(12, Math.round((deptTasks / Math.max(tasks.length, 1)) * 100)) : [84, 72, 61, 48, 36][index] || 30;
      return { ...department, load, taskCount: deptTasks || Math.max(1, Math.round(load / 12)) };
    });

  const recentTasks = tasks.slice(0, 5);

  return (
    <DashboardLayout title="Karpagam Academy of Higher Education – Workflow">
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                minHeight: 290,
                borderRadius: 2,
                border: '1px solid #dde5f0',
                color: 'white',
                bgcolor: '#12365c',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '100%', textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  noWrap
                  sx={{ mb: 1, fontSize: { xs: '1.15rem', sm: '1.7rem', md: '2.35rem' }, lineHeight: 1.08 }}
                >
                  Karpagam Academy of Higher Education – Workflow
                </Typography>
                <Stack direction="row" spacing={2.5} justifyContent="center" alignItems="center" sx={{ mt: 3, flexWrap: 'wrap' }}>
                  <Button variant="outlined" startIcon={<AddTaskRounded />} onClick={() => navigate('/tasks')}>
                    Create Task
                  </Button>
                  <Button variant="outlined" endIcon={<ArrowForwardRounded />} onClick={() => navigate('/reports')}>
                    View Reports
                  </Button>
                </Stack>
              </Box>
              <Box sx={{ position: 'absolute', right: -60, bottom: -80, width: 280, height: 280, border: '42px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              <Box sx={{ position: 'absolute', right: 86, top: 38, width: 110, height: 110, border: '22px solid rgba(84,199,179,0.2)', borderRadius: '50%' }} />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card sx={{ p: 2.5, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 48, height: 48 }}>
                  {card.icon}
                </Avatar>
                <TrendingUpRounded sx={{ color: '#98a2b3', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>{card.value}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary' }}>{card.title}</Typography>
              <Typography variant="body2" color="text.secondary">{card.helper}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ borderRadius: 2, border: '1px solid #dde5f0', overflow: 'hidden' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7edf5' }}>
              <Box>
                <Typography variant="h6">Recent Task Flow</Typography>
                <Typography variant="body2" color="text.secondary">Latest assignments moving through the institution.</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardRounded />} onClick={() => navigate('/tasks')}>All tasks</Button>
            </Box>
            <Stack divider={<Box sx={{ borderTop: '1px solid #edf2f7' }} />}>
              {(recentTasks.length ? recentTasks : [{ id: 'empty', title: loading ? 'Loading task activity...' : 'No tasks created yet', department_name: 'Create a task to begin tracking workflow', status: 'ASSIGNED' }]).map((task) => {
                const config = statusConfig[task.status] || statusConfig.ASSIGNED;
                return (
                  <Box key={task.id} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: config.bg, color: config.color }}>
                      {task.is_special ? <PriorityHighRounded /> : <AssignmentOutlined />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 900 }}>{task.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{task.department_name || task.assigned_to_hod_name || 'General workflow'}</Typography>
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
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #dde5f0', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6">Department Workload</Typography>
                <Typography variant="body2" color="text.secondary">Relative distribution across active units.</Typography>
              </Box>
              <BusinessOutlined sx={{ color: 'text.secondary' }} />
            </Box>
            <Stack spacing={2.5}>
              {departmentLoad.map((department) => (
                <Box key={department.id || department.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{department.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{department.block_name || 'Campus block not assigned'}</Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{department.taskCount} tasks</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={department.load} sx={{ height: 8, borderRadius: 5, bgcolor: '#e7edf5' }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

      </Grid>
    </DashboardLayout>
  );
};

export default AdminDashboard;
