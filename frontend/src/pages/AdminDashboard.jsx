import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Grid, Typography, Box, Card, Avatar } from '@mui/material';
import {
  PeopleOutlined,
  AccountBalanceOutlined,
  AssignmentTurnedInOutlined,
  AssignmentOutlined
} from '@mui/icons-material';
import api from '../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    departments: 0,
    completed_tasks: 0,
    total_tasks: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('users/stats/');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }
    };
    fetchStats();
  }, []);

  const summaryCards = [
    {
      title: 'Total Users',
      value: stats.total_users || 0,
      icon: <PeopleOutlined sx={{ fontSize: 32 }} />,
      color: '#d1e9fc',
      iconColor: '#0c53b7'
    },
    {
      title: 'Total Departments',
      value: stats.departments || 0,
      icon: <AccountBalanceOutlined sx={{ fontSize: 32 }} />,
      color: '#d0f2ff',
      iconColor: '#04297a'
    },
    {
      title: 'Completed Tasks',
      value: stats.completed_tasks || 0,
      icon: <AssignmentTurnedInOutlined sx={{ fontSize: 32 }} />,
      color: '#fff7cd',
      iconColor: '#7a4f01'
    },
    {
      title: 'Created Tasks',
      value: stats.total_tasks || 0,
      icon: <AssignmentOutlined sx={{ fontSize: 32 }} />,
      color: '#ffe7d9',
      iconColor: '#7a0c2e'
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#212b36' }}>
          Hi, Welcome back
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              borderRadius: '16px',
              bgcolor: card.color,
              boxShadow: 'none',
              textAlign: 'center',
              py: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%'
            }}>
              <Avatar sx={{
                width: 64,
                height: 64,
                mb: 3,
                bgcolor: 'transparent',
                backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.24) 100%)`,
                color: card.iconColor
              }}>
                {card.icon}
              </Avatar>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, color: '#212b36' }}>
                {card.value}
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.72, color: '#212b36', fontWeight: 700 }}>
                {card.title}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DashboardLayout>
  );
};

export default AdminDashboard;
