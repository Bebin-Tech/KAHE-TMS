import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import {
  AssignmentTurnedInOutlined,
  CheckCircleRounded,
  DeleteRounded,
  FactCheckRounded,
  VerifiedUserRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';
import { formatApiError } from '../utils/errors';

const CompletedTasks = () => {
  const [completedMainTasks, setCompletedMainTasks] = useState([]);
  const [approvedFacultyTasks, setApprovedFacultyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const session = getCurrentSession();
  const userRole = session?.role;
  const isManagement = ['ADMIN', 'DEAN', 'HOD'].includes(userRole);

  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const [taskRes, subtaskRes] = await Promise.all([
        api.get('tasks/'),
        api.get('subtasks/')
      ]);

      setCompletedMainTasks(taskRes.data.filter((task) => ['COMPLETED', 'DEAN_APPROVED'].includes(task.status)));
      setApprovedFacultyTasks(subtaskRes.data.filter((task) => ['APPROVED_HOD', 'COMPLETED'].includes(task.status)));
    } catch (err) {
      console.error('Error fetching completed tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const handleDelete = async (id, type) => {
    const taskId = id.split('-')[1];
    if (!window.confirm(`Are you sure you want to delete this ${type.toLowerCase()} from your view?`)) return;

    try {
      const endpoint = type === 'Main Task' ? `tasks/${taskId}/` : `subtasks/${taskId}/`;
      await api.delete(endpoint);
      await fetchCompletedTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setNotification({
        open: true,
        severity: 'error',
        message: formatApiError(err, 'Failed to delete record from view.'),
      });
    }
  };

  const archiveRows = useMemo(() => [
    ...completedMainTasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'Main Task',
      title: task.title,
      subtitle: `Assigned on: ${new Date(task.created_at).toLocaleDateString()}`,
      completedBy: task.assigned_to_hod_name || 'HOD',
      department: task.department_name || 'General',
      approvedBy: `${task.created_by_name || 'Dean'} (Dean)`,
      status: 'VERIFIED',
    })),
    ...approvedFacultyTasks.map((task) => ({
      id: `subtask-${task.id}`,
      type: 'Faculty Task',
      title: task.title,
      subtitle: task.task_title ? `Parent task: ${task.task_title}` : 'Faculty work submission',
      completedBy: task.assigned_to_name || 'Faculty',
      department: task.department_name || 'Department not assigned',
      approvedBy: `${task.created_by_name || 'HOD'} (HOD)`,
      status: 'HOD APPROVED',
    })),
  ], [approvedFacultyTasks, completedMainTasks]);

  return (
    <DashboardLayout title="Completed Tasks Archive">
      <Box sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Completed Assignments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Historical record of Dean-finalized tasks and faculty work approved by HODs.
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 920 }}>
          <TableHead>
            <TableRow>
              <TableCell>Task Details</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Completed By</TableCell>
              <TableCell>Approved By</TableCell>
              <TableCell>Status</TableCell>
              {isManagement && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isManagement ? 6 : 5} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : archiveRows.length > 0 ? archiveRows.map((task) => (
              <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: task.type === 'Faculty Task' ? '#dbeafe' : '#ccfbf1', color: task.type === 'Faculty Task' ? '#2563eb' : '#0f766e' }}>
                      {task.type === 'Faculty Task' ? <FactCheckRounded /> : <AssignmentTurnedInOutlined />}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{task.subtitle}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.type}
                    size="small"
                    sx={{ bgcolor: task.type === 'Faculty Task' ? '#dbeafe' : '#ccfbf1', color: task.type === 'Faculty Task' ? '#2563eb' : '#0f766e', fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{task.completedBy}</Typography>
                  <Typography variant="caption" color="text.secondary">{task.department}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUserRounded sx={{ color: '#2563eb', fontSize: '1rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{task.approvedBy}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status}
                    icon={<CheckCircleRounded />}
                    size="small"
                    sx={{ bgcolor: '#ccfbf1', color: '#0f766e', fontWeight: 800, borderRadius: 1 }}
                  />
                </TableCell>
                {isManagement && (
                  <TableCell align="right">
                    <Tooltip title="Delete from view">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(task.id, task.type)}
                      >
                        <DeleteRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={isManagement ? 6 : 5} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">No completed tasks archived yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((current) => ({ ...current, open: false }))}
          sx={{ whiteSpace: 'pre-line' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default CompletedTasks;
