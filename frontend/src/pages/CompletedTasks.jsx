import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Avatar,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
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
  const [modulePermission, setModulePermission] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const currentRole = getCurrentSession()?.role;
  const canDelete = currentRole === 'ADMIN' || Boolean(modulePermission?.can_access && modulePermission?.can_delete);

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

  const fetchModulePermission = async () => {
    try {
      const response = await api.get('user-module-permissions/mine/');
      const permission = response.data.find((row) => row.module === 'completed_tasks');
      setModulePermission(permission || null);
    } catch (err) {
      console.error('Error fetching completed task permissions:', err);
      setModulePermission(null);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
    fetchModulePermission();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const recordId = deleteTarget.id.split('-')[1];

    try {
      const endpoint = deleteTarget.type === 'Main Task' ? `tasks/${recordId}/` : `subtasks/${recordId}/`;
      await api.delete(endpoint);
      setNotification({
        open: true,
        severity: 'success',
        message: `${deleteTarget.type} deleted successfully.`,
      });
      setDeleteTarget(null);
      await fetchCompletedTasks();
    } catch (err) {
      console.error('Error deleting completed task:', err);
      setNotification({
        open: true,
        severity: 'error',
        message: formatApiError(err, 'Failed to delete completed task.'),
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
      <Box sx={{ mb: 3, textAlign: 'left' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.75, color: '#0f172a', fontSize: { xs: '1.45rem', sm: '2.125rem' } }}>
          Completed Assignments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Historical record of Dean-finalized tasks and faculty work approved by HODs.
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid #d8e3f0', borderRadius: 3, overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 20px 54px -42px rgba(15,23,42,0.45)' }}>
        <Table sx={{ minWidth: 920 }}>
          <TableHead sx={{ bgcolor: '#f8fbff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Task Details</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Completed By</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Approved By</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Status</TableCell>
              {canDelete && <TableCell align="right" sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canDelete ? 6 : 5} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : archiveRows.length > 0 ? archiveRows.map((task) => (
              <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fbff' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: task.type === 'Faculty Task' ? '#dbeafe' : '#ccfbf1', color: task.type === 'Faculty Task' ? '#2563eb' : '#0f766e', width: 44, height: 44 }}>
                      {task.type === 'Faculty Task' ? <FactCheckRounded /> : <AssignmentTurnedInOutlined />}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>{task.title}</Typography>
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
                {canDelete && (
                  <TableCell align="right">
                    <Tooltip title="Delete completed task">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(task)}
                      >
                        <DeleteRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={canDelete ? 6 : 5} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">No completed tasks archived yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Delete Completed Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {`This will remove "${deleteTarget?.title || 'this task'}" from Completed Tasks.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
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
