import React from 'react';
import {
  Dialog, DialogContent, Typography, Box, Button
} from '@mui/material';
import { CheckCircleRounded } from '@mui/icons-material';

const TaskSuccessDialog = ({ open, onClose, taskTitle }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{ sx: { borderRadius: '20px', textAlign: 'center' } }}
  >
    <DialogContent sx={{ p: 4 }}>
      <Box
        sx={{
          width: 92,
          height: 92,
          mx: 'auto',
          mb: 2.5,
          borderRadius: '50%',
          bgcolor: '#e8f7f6',
          color: '#1f7f79',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 18px 45px rgba(5, 150, 105, 0.24)'
        }}
      >
        <CheckCircleRounded sx={{ fontSize: 64 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
        Task Assigned Successfully
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {taskTitle ? `"${taskTitle}" has been assigned to the HOD.` : 'The task has been assigned to the HOD.'}
      </Typography>
      <Button variant="contained" color="success" onClick={onClose} sx={{ px: 4, fontWeight: 800 }}>
        Done
      </Button>
    </DialogContent>
  </Dialog>
);

export default TaskSuccessDialog;
