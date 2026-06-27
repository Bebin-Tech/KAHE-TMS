import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Paper, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Tooltip
} from '@mui/material';
import {
  CheckCircleRounded,
  AssignmentTurnedInOutlined,
  VerifiedUserRounded
} from '@mui/icons-material';
import api from '../api/axios';

const CompletedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const res = await api.get('tasks/');
        // Filter tasks that have status COMPLETED
        setTasks(res.data.filter(t => t.status === 'COMPLETED'));
      } catch (err) {
        console.error('Error fetching completed tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompletedTasks();
  }, []);

  return (
    <DashboardLayout title="Completed Tasks Archive">
      <Box sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#212b36' }}>
          Completed Assignments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Historical record of all tasks fully approved and finalized.
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f4f9ff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Task Details</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Completed By</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Approved By</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length > 0 ? tasks.map((task) => (
              <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#e8f7f6', color: '#1f7f79' }}>
                      <AssignmentTurnedInOutlined />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36' }}>{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary">Assigned on: {new Date(task.created_at).toLocaleDateString()}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.assigned_to_hod_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{task.department_name}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUserRounded sx={{ color: '#3B8FF3', fontSize: '1rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.created_by_name} (Dean)</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label="VERIFIED"
                    icon={<CheckCircleRounded />}
                    size="small"
                    sx={{ bgcolor: '#e8f7f6', color: '#1f7f79', fontWeight: 800, borderRadius: '8px' }}
                  />
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">No completed tasks archived yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardLayout>
  );
};

export default CompletedTasks;

