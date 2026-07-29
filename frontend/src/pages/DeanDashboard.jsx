import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import useAutoRefresh from '../hooks/useAutoRefresh';
import {
  Avatar,
  Box,
  Card,
  Grid,
  Typography
} from '@mui/material';
import {
  AssignmentOutlined,
  AssignmentTurnedInOutlined,
  ErrorOutlineRounded,
  PendingActionsRounded,
  TrendingUpRounded
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
    const active = tasks.filter((task) => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_HOD', 'HOD_APPROVED', 'SUBMITTED_DEAN', 'REJECTED_DEAN'].includes(task.status)).length;
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
    },
    {
      title: 'Dean Review',
      value: taskTotals.pendingReview,
      helper: 'Awaiting final decision',
      icon: <PendingActionsRounded />,
      color: '#0f172a',
      bg: '#f1f5f9'
    },
    {
      title: 'Completed',
      value: taskTotals.completed,
      helper: `${taskTotals.completionRate}% completion rate`,
      icon: <AssignmentTurnedInOutlined />,
      color: '#0f766e',
      bg: '#ccfbf1'
    },
    {
      title: 'Overdue',
      value: taskTotals.overdue,
      helper: 'Needs follow-up',
      icon: <ErrorOutlineRounded />,
      color: '#dc2626',
      bg: '#fee2e2'
    }
  ];

  return (
    <DashboardLayout title="Dean Workspace">
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12}>
            <Card
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
                boxShadow: '0 24px 62px -42px rgba(37,99,235,0.58), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 980, mx: 'auto', textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{ mb: 1, fontSize: { xs: '1.55rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.12, fontWeight: 800, color: '#0f172a' }}
                >
                  Karpagam Academy of Higher Education
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: '#1d4ed8', fontWeight: 900, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.85rem' }, lineHeight: 1.12 }}
                >
                  Welcome Back, Dean
                </Typography>
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', right: -70, bottom: -90, width: 300, height: 300, border: '44px solid rgba(37,99,235,0.18)', borderRadius: '50%' }} />
              <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: 92, top: 36, width: 116, height: 116, border: '22px solid rgba(15,118,110,0.18)', borderRadius: '50%' }} />
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2.5}>
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
          </Grid>
        ))}
      </Grid>
    </DashboardLayout>
  );
};

export default DeanDashboard;
