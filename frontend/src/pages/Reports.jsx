import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Box, Paper } from '@mui/material';
import { AssessmentRounded } from '@mui/icons-material';

const Reports = () => {
  return (
    <DashboardLayout title="Reports">
      <Paper sx={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 5 }, border: '1px solid #dde5f0' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
          <Box sx={{ width: 88, height: 88, mx: 'auto', mb: 2.5, borderRadius: '18px', bgcolor: '#e9f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AssessmentRounded sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>System Reports</Typography>
          <Typography variant="body1" color="text.secondary">Reporting tools are being prepared for institutional workflow insights.</Typography>
        </Box>
      </Paper>
    </DashboardLayout>
  );
};

export default Reports;
