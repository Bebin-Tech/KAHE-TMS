import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Box, Card } from '@mui/material';
import { FactCheckOutlined } from '@mui/icons-material';

const CompleteModule = () => {
  return (
    <DashboardLayout title="Complete Module" hideSidebar>
      <Card sx={{
        borderRadius: '16px',
        boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
        p: 4,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <FactCheckOutlined sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#212b36' }}>
            Complete Module
          </Typography>
          <Typography variant="body2" sx={{ color: '#637381' }}>
            System overview and detailed activity tracking.
          </Typography>

          <Box sx={{ mt: 5, p: 3, bgcolor: '#f4f6f8', borderRadius: '16px', border: '1px dashed #e2e8f0', width: '100%', minWidth: { md: 600 } }}>
            <Typography variant="body1" color="text.secondary">
              No recent activity to display in the Complete Module.
            </Typography>
          </Box>
        </Box>
      </Card>
    </DashboardLayout>
  );
};

export default CompleteModule;
