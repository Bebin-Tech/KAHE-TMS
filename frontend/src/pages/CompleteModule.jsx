import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Box, Card } from '@mui/material';
import { FactCheckOutlined } from '@mui/icons-material';

const CompleteModule = () => {
  return (
    <DashboardLayout title="Complete Module" hideSidebar>
      <Card sx={{
        p: { xs: 3, md: 5 },
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white'
      }}>
        <Box sx={{ textAlign: 'center', maxWidth: 640 }}>
          <Box sx={{ width: 88, height: 88, mx: 'auto', mb: 2.5, borderRadius: '18px', bgcolor: '#eaf8f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FactCheckOutlined sx={{ fontSize: 48, color: 'success.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Complete Module
          </Typography>
          <Typography variant="body1" color="text.secondary">
            System overview and detailed activity tracking.
          </Typography>

          <Box sx={{ mt: 5, p: 3, bgcolor: '#f8fbff', borderRadius: 2, border: '1px dashed #c9d8ea', width: '100%', minWidth: { md: 560 } }}>
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
