import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Grid, Typography, Box } from '@mui/material';
import { PeopleRounded, AssessmentRounded, AssignmentRounded, DomainRounded } from '@mui/icons-material';
import api from '../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

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

  const StatBox = ({ title, value, icon, color }) => (
    <Grid item xs={12} sm={6} md={3}>
      <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0' }}>
        <Box sx={{ p: 1.5, bgcolor: `${color}15`, color: color, borderRadius: 3 }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
        </Box>
      </Box>
    </Grid>
  );

  return (
    <DashboardLayout title="Admin Overview">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>System Health</Typography>
        <Typography variant="body1" color="text.secondary">Manage users, departments, and monitor global activity.</Typography>
      </Box>

      <Grid container spacing={3}>
        <StatBox title="Total Users" value={stats?.total_users || 0} icon={<PeopleRounded />} color="#3b82f6" />
        <StatBox title="Active Tasks" value={stats?.total_tasks || 0} icon={<AssignmentRounded />} color="#8b5cf6" />
        <StatBox title="Departments" value={stats?.departments || 0} icon={<DomainRounded />} color="#10b981" />
        <StatBox title="Reports Generated" value={12} icon={<AssessmentRounded />} color="#f59e0b" />
      </Grid>

      {/* More Admin UI could go here */}
    </DashboardLayout>
  );
};

export default AdminDashboard;
