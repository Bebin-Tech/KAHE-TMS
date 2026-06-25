import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Box } from '@mui/material';
import { AssessmentRounded } from '@mui/icons-material';

const Reports = () => {
  return (
    <DashboardLayout title="Reports">
      <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
        <AssessmentRounded sx={{ fontSize: 80, mb: 2, color: 'text.secondary' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>System Reports</Typography>
        <Typography variant="body1">This module is currently under development.</Typography>
      </Box>
    </DashboardLayout>
  );
};

export default Reports;
