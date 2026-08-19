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
  COMPLETED: { label: 'Completed', color: '#1f7f79', bg: '#e8f7f6' },
  DEAN_APPROVED: { label: 'Verified', color: '#1f7f79', bg: '#e8f7f6' },
  ASSIGNED: { label: 'Assigned', color: '#237dba', bg: '#eaf3ff' },
  IN_PROGRESS: { label: 'In Progress', color: '#8a6f00', bg: '#fff8d9' },
  SUBMITTED_HOD: { label: 'HOD Review', color: '#0f172a', bg: '#f1f5f9' },
  SUBMITTED_DEAN: { label: 'Dean Review', color: '#237dba', bg: '#eaf3ff' },
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
  const fetchDashboard = useCallback(async ({ forceRefresh = false } = {}) => {
    const requestConfig = forceRefresh
      ? {
          params: { refresh: Date.now() },
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        }
      : undefined;

    try {
      const [statsRes, taskRes, deptRes] = await Promise.allSettled([
        api.get('users/stats/', requestConfig),
        api.get('tasks/', requestConfig),
        api.get('departments/', requestConfig)
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

  useAutoRefresh(fetchDashboard, 5000);

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
      color: '#237dba',
      bg: '#eaf3ff'
    },
    {
      title: 'Departments',
      value: stats.departments || departments.length || 0,
      helper: 'Academic units onboarded',
      icon: <AccountBalanceOutlined />,
      color: '#1f7f79',
      bg: '#e8f7f6'
    },
    {
      title: 'Completed',
      value: taskTotals.completed,
      helper: `${taskTotals.completionRate}% completion rate`,
      icon: <AssignmentTurnedInOutlined />,
      color: '#0f172a',
      bg: '#ececf1'
    },
    {
      title: 'Total Tasks',
      value: taskTotals.total,
      helper: `${taskTotals.pending} currently active`,
      icon: <AssignmentOutlined />,
      color: '#8a6f00',
      bg: '#fff8d9'
    }
  ];

  const departmentLoad = departments
    .map((department) => {
      const deptTasks = tasks.filter((task) => task.department_name === department.name).length;
      const load = tasks.length ? Math.round((deptTasks / Math.max(tasks.length, 1)) * 100) : 0;
      return { ...department, load, taskCount: deptTasks };
    })
    .filter((department) => department.taskCount > 0)
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 5);

  const recentTasks = tasks.slice(0, 5);

  return (
    <DashboardLayout title="Karpagam Academy of Higher Education - Workflow">
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 2, sm: 2.75, md: 3.25 },
                minHeight: { xs: 165, sm: 205, md: 245 },
                borderRadius: 3,
                border: '1px solid #b7d5fb',
                color: '#122033',
                bgcolor: '#eaf3ff',
                background: 'linear-gradient(135deg, #eaf3ff 0%, #f8fbff 54%, #dbeeff 100%)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 24px 62px -42px rgba(35,125,186,0.58), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 980, mx: 'auto', textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{ mb: 1, fontSize: { xs: '1.55rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.12, fontWeight: 800, color: '#0f172a' }}
                >
                  Karpagam Academy of Higher Education - Workflow
                </Typography>
                <Typography variant="body1" sx={{ color: '#42546b', fontWeight: 750 }}>
                  Real-time academic task coordination and reporting
                </Typography>
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', right: -58, bottom: -76, width: 250, height: 250, border: '38px solid rgba(59,143,243,0.22)', borderRadius: '50%' }} />
              <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: 84, top: 32, width: 96, height: 96, border: '18px solid rgba(52,177,170,0.22)', borderRadius: '50%' }} />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card
              sx={{
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                borderRadius: 3,
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 20px 52px -36px rgba(30,30,44,0.62)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 48, height: 48 }}>
                  {card.icon}
                </Avatar>
                <TrendingUpRounded sx={{ color: '#98a2b3', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 800 }}>{card.value}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 760, color: 'text.primary' }}>{card.title}</Typography>
              <Typography variant="body2" color="text.secondary">{card.helper}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ borderRadius: 3, border: '1px solid #d8e3f0', overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 20px 54px -42px rgba(15,23,42,0.45)' }}>
            <Box sx={{ p: { xs: 2.25, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, borderBottom: '1px solid #e7edf5', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>Recent Task Flow</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>Latest assignments moving through the institution.</Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                endIcon={<ArrowForwardRounded />}
                onClick={() => navigate('/tasks')}
                sx={{ bgcolor: '#ffffff', borderColor: '#b7d5fb', fontWeight: 850, borderRadius: 1.5, alignSelf: { xs: 'flex-start', sm: 'center' } }}
              >
                All tasks
              </Button>
            </Box>
            <Stack spacing={0}>
              {(recentTasks.length ? recentTasks : [{ id: 'empty', title: loading ? 'Loading task activity...' : 'No tasks created yet', department_name: 'Create a task to begin tracking workflow', status: 'ASSIGNED' }]).map((task) => {
                const config = statusConfig[task.status] || statusConfig.ASSIGNED;
                return (
                  <Box
                    key={task.id}
                    sx={{
                      mx: { xs: 1.5, md: 2 },
                      my: 1,
                      p: { xs: 1.75, md: 2 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderRadius: 2,
                      border: '1px solid #edf2f7',
                      bgcolor: '#ffffff',
                      transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                      '&:hover': {
                        bgcolor: '#f8fbff',
                        borderColor: '#d8e7fb',
                        boxShadow: '0 16px 36px -30px rgba(15,23,42,0.4)'
                      }
                    }}
                  >
                    <Avatar sx={{ bgcolor: config.bg, color: config.color, width: { xs: 40, sm: 46 }, height: { xs: 40, sm: 46 } }}>
                      {task.is_special ? <PriorityHighRounded /> : <AssignmentOutlined />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>{task.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.35 }}>{task.department_name || task.assigned_to_hod_name || 'General workflow'}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', gap: 0.75, minWidth: 116 }}>
                      <Chip label={config.label} size="small" sx={{ bgcolor: config.bg, color: config.color, fontWeight: 900, borderRadius: 1.25 }} />
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700 }}>{formatDate(task.deadline)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, border: '1px solid #d8e3f0', height: '100%', bgcolor: '#ffffff', boxShadow: '0 20px 54px -42px rgba(15,23,42,0.45)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>Department Workload</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>Relative distribution across active units.</Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#f1f5f9', color: '#64748b', width: 42, height: 42 }}>
                <BusinessOutlined />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', mb: 3 }}>
              <Chip label={`${departmentLoad.length} active units`} size="small" sx={{ bgcolor: '#eaf3ff', color: '#237dba', fontWeight: 850, borderRadius: 1.25 }} />
              <Chip label={`${taskTotals.total} total tasks`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 850, borderRadius: 1.25 }} />
            </Box>
            {departmentLoad.length > 0 ? (
              <Stack spacing={2}>
                {departmentLoad.map((department) => (
                  <Box key={department.id || department.name} sx={{ p: 2, border: '1px solid #edf2f7', borderRadius: 2, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.1, gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 900, color: '#0f172a' }}>{department.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{department.block_name || 'Campus block not assigned'}</Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{department.taskCount} tasks</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LinearProgress variant="determinate" value={department.load} sx={{ flex: 1, height: 9, borderRadius: 5, bgcolor: '#e7edf5' }} />
                      <Typography variant="caption" sx={{ width: 38, textAlign: 'right', color: 'text.secondary', fontWeight: 850 }}>{department.load}%</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center', borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <BusinessOutlined sx={{ color: 'text.secondary', fontSize: 42, mb: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>No workload data available</Typography>
                <Typography variant="body2" color="text.secondary">
                  Department workload will appear when active tasks are assigned.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>
    </DashboardLayout>
  );
};

export default AdminDashboard;

