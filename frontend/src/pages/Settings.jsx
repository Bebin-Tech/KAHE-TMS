import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Box } from '@mui/material';
import { SettingsRounded } from '@mui/icons-material';

const Settings = () => {
  return (
    <DashboardLayout title="Settings">
      <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
        <SettingsRounded sx={{ fontSize: 80, mb: 2, color: 'text.secondary' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Account Settings</Typography>
        <Typography variant="body1">This module is currently under development.</Typography>
      </Box>
    </DashboardLayout>
  );
};

export default Settings;
