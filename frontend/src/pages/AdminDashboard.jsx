import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import useAutoRefresh from '../hooks/useAutoRefresh';
import TextAnimate from '../components/TextAnimate';
import StatCard from '../components/StatCard';
import {
  Box,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import {
  AccountBalanceOutlined,
  AssignmentOutlined,
  AssignmentTurnedInOutlined,
  PeopleOutlined
} from '@mui/icons-material';
import api from '../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    departments: 0,
    completed_tasks: 0,
    total_tasks: 0
  });
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
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
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useAutoRefresh(fetchDashboard, 15000);

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
      color: '#2563eb',
      bg: '#eff6ff',
      borderColor: 'rgba(37,99,235,0.22)',
      glow: 'rgba(37,99,235,0.12)',
      badge: {
        label: 'Members',
        bg: '#eff6ff',
        color: '#1d4ed8',
        borderColor: 'rgba(37,99,235,0.2)'
      }
    },
    {
      title: 'Departments',
      value: stats.departments || departments.length || 0,
      helper: 'Academic units onboarded',
      icon: <AccountBalanceOutlined />,
      color: '#0f766e',
      bg: '#ccfbf1',
      borderColor: 'rgba(15,118,110,0.22)',
      glow: 'rgba(15,118,110,0.12)',
      badge: {
        label: 'Departments',
        bg: '#ccfbf1',
        color: '#0f766e',
        borderColor: 'rgba(15,118,110,0.2)'
      }
    },
    {
      title: 'Completed Tasks',
      value: taskTotals.completed,
      helper: `${taskTotals.completionRate}% institutional completion rate`,
      icon: <AssignmentTurnedInOutlined />,
      color: '#059669',
      bg: '#ecfdf5',
      borderColor: 'rgba(5,150,105,0.22)',
      glow: 'rgba(5,150,105,0.12)',
      progress: taskTotals.completionRate,
      badge: {
        label: `${taskTotals.completionRate}% Done`,
        bg: '#ecfdf5',
        color: '#047857',
        borderColor: 'rgba(5,150,105,0.2)'
      }
    },
    {
      title: 'Total Tasks',
      value: taskTotals.total,
      helper: `${taskTotals.pending} currently active tasks`,
      icon: <AssignmentOutlined />,
      color: '#d97706',
      bg: '#fffbeb',
      borderColor: 'rgba(217,119,6,0.22)',
      glow: 'rgba(217,119,6,0.12)',
      badge: {
        label: `${taskTotals.pending} Active`,
        bg: '#fffbeb',
        color: '#b45309',
        borderColor: 'rgba(217,119,6,0.2)'
      }
    }
  ];

  return (
    <DashboardLayout title="Admin Workspace">
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 2.25, sm: 3, md: 4 },
                minHeight: { xs: 220, sm: 240, md: 280 },
                borderRadius: 3,
                border: '1px solid #bfdbfe',
                color: '#0f172a',
                bgcolor: '#eff6ff',
                background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 54%, #dbeafe 100%)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 24px 62px -42px rgba(37,99,235,0.58), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 980, mx: 'auto', textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    mb: 1,
                    fontSize: { xs: '1.55rem', sm: '2rem', md: '2.5rem' },
                    lineHeight: 1.12,
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  <TextAnimate delay={0.1}>Karpagam Academy of Higher Education</TextAnimate>
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: '#1d4ed8',
                    fontWeight: 900,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.85rem' },
                    lineHeight: 1.12,
                  }}
                >
                  <TextAnimate delay={0.45} stagger={0.035}>Welcome Back, Admin</TextAnimate>
                </Typography>
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', right: -70, bottom: -90, width: 300, height: 300, border: '44px solid rgba(37,99,235,0.18)', borderRadius: '50%' }} />
              <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: 92, top: 36, width: 116, height: 116, border: '22px solid rgba(15,118,110,0.18)', borderRadius: '50%' }} />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

    </DashboardLayout>
  );
};

export default AdminDashboard;
