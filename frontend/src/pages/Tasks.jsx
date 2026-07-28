import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CreateTaskDialog from '../components/CreateTaskDialog';
import CreateSubTaskDialog from '../components/CreateSubTaskDialog';
import TaskSuccessDialog from '../components/TaskSuccessDialog';
import {
  Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Avatar, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Stack
} from '@mui/material';
import {
  AddRounded,
  AssignmentOutlined,
  EditRounded,
  DeleteRounded,
  StarRounded,
  ScheduleRounded,
  CheckCircleRounded,
  CancelRounded,
  VisibilityRounded,
  PlayArrowRounded,
  DoneAllRounded,
  FlagRounded,
  AttachFileRounded
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';
import { formatApiError } from '../utils/errors';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';
const fileBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
const getFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${fileBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const Tasks = () => {
  const currentRole = getCurrentSession()?.role;
  const isHod = currentRole === 'HOD';
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionTarget, setCompletionTarget] = useState(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [facultyAssignmentTask, setFacultyAssignmentTask] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successTask, setSuccessTask] = useState(null);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const showMessage = (message, severity = 'success') => {
    setNotification({ open: true, severity, message });
  };

  const fetchData = useCallback(async () => {
    try {
      const endpoint = isHod ? 'tasks/assigned-to-me/' : 'tasks/';
      const res = await api.get(endpoint, {
        params: { refresh: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }, [isHod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleStartWork = async (task) => {
    setActionLoading(true);
    try {
      await api.patch(`tasks/${task.id}/`, { status: 'IN_PROGRESS' });
      showMessage('Task status updated to In Progress.');
      await fetchData();
      setSelectedTask((current) => (current?.id === task.id ? { ...current, status: 'IN_PROGRESS' } : current));
    } catch (err) {
      showMessage(formatApiError(err, 'Failed to start the task.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenComplete = (task) => {
    setCompletionTarget(task);
    setCompletionRemarks('');
  };

  const handleCompleteTask = async () => {
    if (!completionTarget) return;

    setActionLoading(true);
    try {
      await api.post(`tasks/${completionTarget.id}/complete_by_hod/`, {
        remarks: completionRemarks || 'Task completed by HOD.',
      });
      showMessage('Task completed and moved to Completed Tasks.');
      setCompletionTarget(null);
      setCompletionRemarks('');
      setSelectedTask(null);
      await fetchData();
    } catch (err) {
      showMessage(formatApiError(err, 'Failed to complete the task.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignFaculty = (task) => {
    setFacultyAssignmentTask(task);
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

  const getPriorityChip = (priority, isSpecial) => {
    const priorityStyles = {
      LOW: { bg: '#e8f7f6', color: '#1f7f79', label: 'Low' },
      MEDIUM: { bg: '#eaf3ff', color: '#237dba', label: 'Medium' },
      HIGH: { bg: '#fff8d9', color: '#8a6f00', label: 'High' },
      URGENT: { bg: '#fff0ef', color: '#c2413b', label: 'Urgent' },
    };
    const style = isSpecial ? { bg: '#fff8d9', color: '#8a6f00', label: 'Special' } : (priorityStyles[priority] || priorityStyles.MEDIUM);
    return (
      <Chip
        icon={isSpecial ? <StarRounded /> : <FlagRounded />}
        label={style.label}
        size="small"
        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 850, borderRadius: '8px', '& .MuiChip-icon': { color: style.color } }}
      />
    );
  };

  const visibleTasks = tasks;

  const canStartTask = (task) => ['ASSIGNED', 'REJECTED_DEAN'].includes(task.status);
  const canCompleteTask = (task) => !['COMPLETED', 'DEAN_APPROVED', 'CANCELLED', 'SUBMITTED_DEAN'].includes(task.status);

  return (
    <DashboardLayout title="Task Management">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.75, color: '#0f172a', fontSize: { xs: '1.45rem', sm: '2.125rem' } }}>
            {isHod ? 'HOD Task Module' : 'System Tasks'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isHod ? 'Open assigned Dean tasks, review priority, update progress, and complete work.' : 'Assign and monitor tasks across all departments.'}
          </Typography>
        </Box>
        {!isHod && (
          <Button
            variant="outlined"
            startIcon={<AddRounded />}
            onClick={() => setOpen(true)}
            sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-start', md: 'center' }, bgcolor: '#ffffff', borderColor: '#b7d5fb', fontWeight: 850, borderRadius: 1.5 }}
          >
            Create New Task
          </Button>
        )}
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
            {visibleTasks.length > 0 ? visibleTasks.map((task) => (
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
                        {isHod && getPriorityChip(task.priority, task.is_special)}
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
                  {isHod ? (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" startIcon={<VisibilityRounded />} onClick={() => setSelectedTask(task)}>
                        Open
                      </Button>
                      {canStartTask(task) && (
                        <Button size="small" variant="outlined" startIcon={<PlayArrowRounded />} disabled={actionLoading} onClick={() => handleStartWork(task)}>
                          Start
                        </Button>
                      )}
                      {canCompleteTask(task) && (
                        <Button size="small" variant="contained" startIcon={<DoneAllRounded />} disabled={actionLoading} onClick={() => handleOpenComplete(task)}>
                          Complete
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <>
                      <IconButton onClick={() => handleEdit(task)} size="small" sx={{ color: '#237dba' }}><EditRounded fontSize="small" /></IconButton>
                      <IconButton onClick={() => setDeleteTarget(task)} size="small" sx={{ color: '#f44336' }}><DeleteRounded fontSize="small" /></IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <AssignmentOutlined sx={{ fontSize: 48, color: '#919eab', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {isHod ? 'No active HOD tasks found. Completed tasks appear in Completed Tasks.' : 'No tasks found. Create one to get started.'}
                  </Typography>
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
      <Dialog open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Task Details</DialogTitle>
        <DialogContent dividers>
          {selectedTask && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', flex: 1 }}>{selectedTask.title}</Typography>
                  {getPriorityChip(selectedTask.priority, selectedTask.is_special)}
                  {getStatusChip(selectedTask.status)}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{selectedTask.description}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Department</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.department_name || 'General'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Assigned By</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.created_by_name || 'Dean'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Start Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleString() : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Due Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleString() : 'N/A'}</Typography>
              </Grid>
              {selectedTask.attachment && (
                <Grid item xs={12}>
                  <Button variant="outlined" startIcon={<AttachFileRounded />} href={getFileUrl(selectedTask.attachment)} target="_blank" rel="noreferrer" download>
                    Open / Download Attachment
                  </Button>
                </Grid>
              )}
              {selectedTask.subtasks?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Faculty Sub-Tasks</Typography>
                  <Stack spacing={1}>
                    {selectedTask.subtasks.map((subtask) => (
                      <Box key={subtask.id} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>{subtask.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {subtask.assigned_to_name || 'Faculty'} - {subtask.status}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setSelectedTask(null)} color="inherit">Close</Button>
          {selectedTask && canStartTask(selectedTask) && (
            <Button variant="outlined" startIcon={<PlayArrowRounded />} disabled={actionLoading} onClick={() => handleStartWork(selectedTask)}>
              Start Work
            </Button>
          )}
          {isHod && selectedTask && (
            <Button variant="outlined" startIcon={<AddRounded />} onClick={() => handleAssignFaculty(selectedTask)}>
              Assign Faculty
            </Button>
          )}
          {selectedTask && canCompleteTask(selectedTask) && (
            <Button variant="contained" startIcon={<DoneAllRounded />} disabled={actionLoading} onClick={() => handleOpenComplete(selectedTask)}>
              Complete Task
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(completionTarget)} onClose={() => setCompletionTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Complete Task</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add final remarks before moving this task to Completed Tasks.
          </Typography>
          <TextField
            fullWidth
            label="Completion Remarks"
            multiline
            minRows={4}
            value={completionRemarks}
            onChange={(event) => setCompletionRemarks(event.target.value)}
            placeholder="Enter completion details, remarks, or summary..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCompletionTarget(null)} color="inherit">Cancel</Button>
          <Button variant="contained" startIcon={<DoneAllRounded />} disabled={actionLoading} onClick={handleCompleteTask}>
            Complete
          </Button>
        </DialogActions>
      </Dialog>
      {facultyAssignmentTask && (
        <CreateSubTaskDialog
          open={Boolean(facultyAssignmentTask)}
          onClose={() => setFacultyAssignmentTask(null)}
          taskId={facultyAssignmentTask.id}
          taskDepartmentId={facultyAssignmentTask.department}
          onTaskCreated={async () => {
            showMessage('Task assigned to Faculty successfully.');
            setFacultyAssignmentTask(null);
            setSelectedTask(null);
            await fetchData();
          }}
        />
      )}
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

