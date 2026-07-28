import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskDialog from '../components/CreateTaskDialog';
import TaskSuccessDialog from '../components/TaskSuccessDialog';
import {
  Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Avatar, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  AddRounded,
  AssignmentOutlined,
  EditRounded,
  DeleteRounded,
  StarRounded,
  ScheduleRounded,
  CheckCircleRounded,
  CancelRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { formatApiError } from '../utils/errors';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successTask, setSuccessTask] = useState(null);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const showMessage = (message, severity = 'success') => {
    setNotification({ open: true, severity, message });
  };

  const fetchData = async () => {
    try {
      const res = await api.get('tasks/');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (task) => {
    setEditingTask(task);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`tasks/${deleteTarget.id}/`);
      setDeleteTarget(null);
      showMessage('Task deleted successfully.');
      fetchData();
    } catch (err) {
      console.error('Error deleting task:', err);
      showMessage(formatApiError(err, 'Failed to delete task.'), 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleRounded sx={{ color: '#1f7f79', fontSize: '1rem' }} />;
      case 'CANCELLED': return <CancelRounded sx={{ color: '#ef4444', fontSize: '1rem' }} />;
      default: return <ScheduleRounded sx={{ color: '#237dba', fontSize: '1rem' }} />;
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      'ONGOING': { bg: '#eaf3ff', color: '#237dba' },
      'CANCELLED': { bg: '#fef2f2', color: '#b91c1c' },
      'COMPLETED': { bg: '#e8f7f6', color: '#1f7f79' }
    };
    const style = colors[status] || colors['ONGOING'];
    return (
      <Chip
        label={status}
        size="small"
        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, borderRadius: '8px', fontSize: '0.75rem' }}
      />
    );
  };

  return (
    <DashboardLayout title="Task Management">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.75, color: '#0f172a', fontSize: { xs: '1.45rem', sm: '2.125rem' } }}>
            System Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assign and monitor tasks across all departments.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddRounded />}
          onClick={() => setOpen(true)}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' }, bgcolor: '#ffffff', borderColor: '#b7d5fb', fontWeight: 850, borderRadius: 1.5 }}
        >
          Create New Task
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid #d8e3f0', borderRadius: 3, overflow: 'hidden', bgcolor: '#ffffff', boxShadow: '0 20px 54px -42px rgba(15,23,42,0.45)' }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead sx={{ bgcolor: '#f8fbff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Task Details</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Assignee</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Timeline</TableCell>
              <TableCell sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, color: '#475569', py: 2 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length > 0 ? tasks.map((task) => (
              <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fbff' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: task.is_special ? '#fff8d9' : '#eaf3ff', color: task.is_special ? '#8a6f00' : '#237dba', width: 44, height: 44 }}>
                      <AssignmentOutlined />
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                          {task.title}
                        </Typography>
                        {task.is_special && (
                          <Tooltip title="Special Task">
                            <StarRounded sx={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.description}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.assigned_to_hod_name || 'Unassigned'}</Typography>
                  <Typography variant="caption" color="text.secondary">{task.department_name || 'General'}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#637381' }}>
                      Start: {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#237dba' }}>
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(task.status)}
                    {getStatusChip(task.status)}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(task)} size="small" sx={{ color: '#237dba' }}><EditRounded fontSize="small" /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(task)} size="small" sx={{ color: '#f44336' }}><DeleteRounded fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <AssignmentOutlined sx={{ fontSize: 48, color: '#919eab', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">No tasks found. Create one to get started.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateTaskDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingTask(null);
        }}
        onTaskCreated={(savedTask, wasCreated) => {
          fetchData();
          if (wasCreated) setSuccessTask(savedTask);
        }}
        task={editingTask}
      />
      <TaskSuccessDialog
        open={Boolean(successTask)}
        onClose={() => setSuccessTask(null)}
        taskTitle={successTask?.title}
      />
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {`Delete "${deleteTarget?.title || 'this task'}"? It will no longer appear in active task lists.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
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

export default Tasks;

