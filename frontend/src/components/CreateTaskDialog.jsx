import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography, Box,
  CircularProgress, Alert, FormControlLabel, Checkbox
} from '@mui/material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';

const CreateTaskDialog = ({ open, onClose, onTaskCreated, task = null }) => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showingAllHods, setShowingAllHods] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    assigned_to_hod: '',
    start_date: '',
    deadline: '',
    status: 'ASSIGNED',
    is_special: false,
    priority: 'MEDIUM'
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
      if (task) {
        setFormData({
          title: task.title,
          description: task.description,
          department: task.department || '',
          assigned_to_hod: task.assigned_to_hod || '',
          start_date: task.start_date ? task.start_date.slice(0, 16) : '',
          deadline: task.deadline ? task.deadline.slice(0, 16) : '',
          status: task.status,
          is_special: task.is_special,
          priority: task.priority
        });
        if (task.department) {
          fetchUsersByDepartment(task.department);
        }
      } else {
        resetForm();
      }
      setError('');
    }
  }, [open, task]);

  const fetchDepartments = async () => {
    setFetchingData(true);
    try {
      const response = await api.get('departments/');
      setDepartments(response.data);
    } catch (err) {
      setError('Failed to fetch departments.');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchUsersByDepartment = async (deptId) => {
    setFetchingData(true);
    try {
      const response = await api.get(`users/hods/?department=${deptId}`);
      if (response.data.length > 0) {
        setUsers(response.data);
        setShowingAllHods(false);
        return;
      }

      const fallbackResponse = await api.get('users/hods/');
      setUsers(fallbackResponse.data);
      setShowingAllHods(fallbackResponse.data.length > 0);
    } catch (err) {
      setUsers([]);
      setShowingAllHods(false);
      setError('Failed to fetch HODs for this department.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleDepartmentChange = (deptId) => {
    setFormData({ ...formData, department: deptId, assigned_to_hod: '' });
    fetchUsersByDepartment(deptId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare data
    const submitData = { ...formData };
    if (submitData.department === '') submitData.department = null;
    if (submitData.assigned_to_hod === '') submitData.assigned_to_hod = null;
    if (!task) submitData.status = 'ASSIGNED';

    try {
      let savedTask;
      if (task) {
        const response = await api.patch(`tasks/${task.id}/`, submitData);
        savedTask = response.data;
      } else {
        const currentUser = getCurrentSession()?.session?.user;
        const response = await api.post('tasks/', {
          ...submitData,
          created_by: currentUser?.id
        });
        savedTask = response.data;
      }
      onTaskCreated(savedTask, !task);
      onClose();
    } catch (err) {
      console.error('Error processing task:', err);
      const errorData = err.response?.data;
      let errorMessage = 'Failed to process task. Check all fields.';
      if (errorData) {
        errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department: '',
      assigned_to_hod: '',
      start_date: '',
      deadline: '',
      status: 'ASSIGNED',
      is_special: false,
      priority: 'MEDIUM'
    });
    setUsers([]);
    setShowingAllHods(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: 'primary.main', pb: 1 }}>
          {task ? 'Edit Task Assignment' : 'Create New Task Assignment'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Task Name" required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter a descriptive task name"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth label="Task Description" multiline rows={4} required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the task requirements in detail"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Department" required
                value={formData.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={fetchingData}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Assign to HOD" required
                value={formData.assigned_to_hod}
                onChange={(e) => setFormData({...formData, assigned_to_hod: e.target.value})}
                disabled={!formData.department || fetchingData}
                helperText={
                  formData.department && !fetchingData && users.length === 0
                    ? 'No active HOD found. Add an active HOD user first.'
                    : showingAllHods
                      ? 'No HOD is linked to this department, so all active HODs are shown.'
                      : 'Select the department HOD who will own this task'
                }
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.role})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Start Date" type="datetime-local" required
                InputLabelProps={{ shrink: true }}
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Due Date" type="datetime-local" required
                InputLabelProps={{ shrink: true }}
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </Grid>

            {task && (
            <Grid item xs={12} sm={4}>
              <TextField
                select fullWidth label="Task Status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <MenuItem value="ASSIGNED">Assigned</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="SUBMITTED_DEAN">Submitted to Dean</MenuItem>
                <MenuItem value="REJECTED_DEAN">Rejected by Dean</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </TextField>
            </Grid>
            )}

            <Grid item xs={12} sm={task ? 4 : 6}>
              <TextField
                select fullWidth label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={task ? 4 : 6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_special}
                    onChange={(e) => setFormData({...formData, is_special: e.target.checked})}
                  />
                }
                label="Special Task"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || fetchingData}
            sx={{ px: 4, py: 1.2, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (task ? 'Update Task' : 'Create Task')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTaskDialog;
