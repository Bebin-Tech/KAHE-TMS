import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Box, Paper } from '@mui/material';
import { SettingsRounded } from '@mui/icons-material';

const Settings = () => {
  return (
    <DashboardLayout title="Settings">
      <Paper sx={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 5 }, border: '1px solid #dde5f0' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
          <Box sx={{ width: 88, height: 88, mx: 'auto', mb: 2.5, borderRadius: '18px', bgcolor: '#eef5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SettingsRounded sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>Account Settings</Typography>
          <Typography variant="body1" color="text.secondary">Account preferences and access controls are being prepared.</Typography>
        </Box>
      </Paper>
    </DashboardLayout>
  );
};

export default Settings;
