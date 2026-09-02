import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import useAutoRefresh from '../hooks/useAutoRefresh';
import TextAnimate from '../components/TextAnimate';
import StatCard from '../components/StatCard';
import {
  Avatar,
  Box,
  Card,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import {
  AssignmentOutlined,
  AssignmentTurnedInOutlined,
  ErrorOutlineRounded,
  PendingActionsRounded,
  TrendingUpRounded
  PendingActionsRounded
} from '@mui/icons-material';
import api from '../api/axios';

const DeanDashboard = () => {
  const [tasks, setTasks] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('tasks/');
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 10000);

  const taskTotals = useMemo(() => {
    const completed = tasks.filter((task) => ['COMPLETED', 'DEAN_APPROVED'].includes(task.status)).length;
    const pendingReview = tasks.filter((task) => task.status === 'SUBMITTED_DEAN').length;
    const overdue = tasks.filter((task) => task.deadline && new Date(task.deadline) < new Date() && !['COMPLETED', 'DEAN_APPROVED', 'CANCELLED'].includes(task.status)).length;
    const active = tasks.filter((task) => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_HOD', 'HOD_APPROVED', 'SUBMITTED_DEAN'].includes(task.status)).length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    return { completed, pendingReview, overdue, active, total: tasks.length, completionRate };
  }, [tasks]);

  const summaryCards = [
    {
      title: 'Total Tasks',
      value: taskTotals.total,
      helper: `${taskTotals.active} currently active`,
      icon: <AssignmentOutlined />,
      color: '#2563eb',
      bg: '#dbeafe'
      bg: '#eff6ff',
      borderColor: 'rgba(37,99,235,0.22)',
      glow: 'rgba(37,99,235,0.12)',
      badge: {
        label: 'Active',
        bg: '#eff6ff',
        color: '#1d4ed8',
        borderColor: 'rgba(37,99,235,0.2)'
      }
    },
    {
      title: 'Dean Review',
      value: taskTotals.pendingReview,
      helper: 'Awaiting final decision',
      helper: taskTotals.pendingReview > 0 ? `${taskTotals.pendingReview} awaiting approval` : 'All tasks reviewed',
      icon: <PendingActionsRounded />,
      color: '#0f172a',
      bg: '#f1f5f9'
      color: '#7c3aed',
      bg: '#f5f3ff',
      borderColor: 'rgba(124,58,237,0.22)',
      glow: 'rgba(124,58,237,0.12)',
      badge: {
        label: taskTotals.pendingReview > 0 ? 'Action Needed' : 'Up to Date',
        bg: taskTotals.pendingReview > 0 ? '#fef3c7' : '#f5f3ff',
        color: taskTotals.pendingReview > 0 ? '#b45309' : '#6d28d9',
        borderColor: taskTotals.pendingReview > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(124,58,237,0.2)'
      }
    },
    {
      title: 'Completed',
      value: taskTotals.completed,
      helper: `${taskTotals.completionRate}% completion rate`,
      helper: `${taskTotals.completionRate}% institutional completion rate`,
      icon: <AssignmentTurnedInOutlined />,
      color: '#0f766e',
      bg: '#ccfbf1'
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
      title: 'Overdue',
      value: taskTotals.overdue,
      helper: 'Needs follow-up',
      helper: taskTotals.overdue > 0 ? `${taskTotals.overdue} tasks past deadline` : 'No overdue tasks',
      icon: <ErrorOutlineRounded />,
      color: '#dc2626',
      bg: '#fee2e2'
      bg: '#fef2f2',
      borderColor: 'rgba(220,38,38,0.22)',
      glow: 'rgba(220,38,38,0.12)',
      badge: {
        label: taskTotals.overdue > 0 ? 'Urgent' : 'On Track',
        bg: taskTotals.overdue > 0 ? '#fee2e2' : '#f0fdf4',
        color: taskTotals.overdue > 0 ? '#b91c1c' : '#15803d',
        borderColor: taskTotals.overdue > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'
      }
    }
  ];

  return (
    <DashboardLayout title="Dean Workspace">
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
                  sx={{ mb: 1, fontSize: { xs: '1.55rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.12, fontWeight: 800, color: '#0f172a' }}
                >
                  <TextAnimate delay={0.1}>Karpagam Academy of Higher Education</TextAnimate>
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: '#1d4ed8', fontWeight: 900, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.85rem' }, lineHeight: 1.12 }}
                >
                  <TextAnimate delay={0.45} stagger={0.035}>Welcome Back, Dean</TextAnimate>
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
            <Card
              sx={{
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                borderRadius: 3,
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 20px 52px -36px rgba(15,23,42,0.62)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 48, height: 48 }}>
                  {card.icon}
                </Avatar>
                <TrendingUpRounded sx={{ color: '#94a3b8', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 800 }}>{card.value}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 760, color: 'text.primary' }}>{card.title}</Typography>
              <Typography variant="body2" color="text.secondary">{card.helper}</Typography>
            </Card>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>
    </DashboardLayout>
  );
};

export default DeanDashboard;
