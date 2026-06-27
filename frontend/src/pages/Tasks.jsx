import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskDialog from '../components/CreateTaskDialog';
import TaskSuccessDialog from '../components/TaskSuccessDialog';
import {
  Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Avatar, Grid
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

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successTask, setSuccessTask] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get('tasks/');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (task) => {
    setEditingTask(task);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`tasks/${id}/`);
        fetchData();
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task.');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleRounded sx={{ color: '#059669', fontSize: '1rem' }} />;
      case 'CANCELLED': return <CancelRounded sx={{ color: '#ef4444', fontSize: '1rem' }} />;
      default: return <ScheduleRounded sx={{ color: '#3b82f6', fontSize: '1rem' }} />;
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      'ONGOING': { bg: '#eff6ff', color: '#1d4ed8' },
      'CANCELLED': { bg: '#fef2f2', color: '#b91c1c' },
      'COMPLETED': { bg: '#ecfdf5', color: '#047857' }
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#212b36', fontSize: { xs: '1.45rem', sm: '2.125rem' } }}>
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
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' } }}
        >
          Create New Task
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead sx={{ bgcolor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Task Details</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Assignee</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Timeline</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#637381' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#637381' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length > 0 ? tasks.map((task) => (
              <TableRow key={task.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: task.is_special ? '#fff7cd' : '#f4f6f8', color: task.is_special ? '#7a4f01' : '#637381' }}>
                      <AssignmentOutlined />
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212b36' }}>
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
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1976d2' }}>
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
                  <IconButton onClick={() => handleEdit(task)} size="small" sx={{ color: '#1976d2' }}><EditRounded fontSize="small" /></IconButton>
                  <IconButton onClick={() => handleDelete(task.id)} size="small" sx={{ color: '#f44336' }}><DeleteRounded fontSize="small" /></IconButton>
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
    </DashboardLayout>
  );
};

export default Tasks;
