import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Box, Typography,
  CircularProgress, Alert, FormControlLabel, Checkbox
} from '@mui/material';
import { AttachFileRounded, CloudUploadRounded } from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';
import { formatApiError } from '../utils/errors';

const CreateTaskDialog = ({ open, onClose, onTaskCreated, task = null }) => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [showingAllHods, setShowingAllHods] = useState(false);
  const [showingAllFaculty, setShowingAllFaculty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isGroupTask, setIsGroupTask] = useState(false);
  const currentUser = getCurrentSession()?.session?.user;
  const isHodCreate = currentUser?.role === 'HOD' && !task;
  const canCreateGroupTask = currentUser?.role === 'DEAN' && !task;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    assigned_to_hod: '',
    assigned_to_faculty: '',
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
          assigned_to_faculty: '',
          start_date: task.start_date ? task.start_date.slice(0, 16) : '',
          deadline: task.deadline ? task.deadline.slice(0, 16) : '',
          status: task.status,
          is_special: task.is_special,
          priority: task.priority
        });
        if (task.department) {
          fetchUsersByDepartment(task.department);
        }
        setAttachment(null);
        setIsGroupTask(false);
      } else {
        resetForm();
        if (isHodCreate && currentUser?.department) {
          fetchFacultyByDepartment(currentUser.department);
        }
      }
      setError('');
    }
  }, [open, task, isHodCreate, currentUser?.department]);

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

  const fetchFacultyByDepartment = async (deptId) => {
    setFetchingData(true);
    try {
      const response = await api.get(`users/?department=${deptId}`);
      const departmentFaculty = response.data.filter((user) => user.role === 'FACULTY' && user.is_active);
      if (departmentFaculty.length > 0) {
        setFacultyUsers(departmentFaculty);
        setShowingAllFaculty(false);
        return;
      }

      const fallbackResponse = await api.get('users/');
      const allFaculty = fallbackResponse.data.filter((user) => user.role === 'FACULTY' && user.is_active);
      setFacultyUsers(allFaculty);
      setShowingAllFaculty(allFaculty.length > 0);
    } catch (err) {
      setFacultyUsers([]);
      setShowingAllFaculty(false);
      setError('Failed to fetch Faculty members for this department.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleDepartmentChange = (deptId) => {
    setFormData({ ...formData, department: deptId, assigned_to_hod: '' });
    fetchUsersByDepartment(deptId);
  };

  const handleGroupTaskChange = (checked) => {
    setIsGroupTask(checked);
    if (checked) {
      setFormData((current) => ({ ...current, department: '', assigned_to_hod: '' }));
      setUsers([]);
      setShowingAllHods(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submitData = { ...formData };
    const assignedFaculty = submitData.assigned_to_faculty;
    delete submitData.assigned_to_faculty;
    if (isHodCreate) {
      submitData.department = currentUser?.department || null;
      submitData.assigned_to_hod = currentUser?.id || null;
    }
    if (submitData.department === '') submitData.department = null;
    if (submitData.assigned_to_hod === '') submitData.assigned_to_hod = null;
    if (!task) submitData.status = 'ASSIGNED';
    const requestData = new FormData();
    Object.entries(submitData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        requestData.append(key, value);
      }
    });
    if (attachment) {
      requestData.append('attachment', attachment);
    }

    try {
      let savedTask;
      if (task) {
        const response = await api.patch(`tasks/${task.id}/`, requestData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        savedTask = response.data;
      } else {
        const currentUser = getCurrentSession()?.session?.user;
        if (currentUser?.id) {
          requestData.append('created_by', currentUser.id);
        }
        if (isGroupTask && canCreateGroupTask) {
          const response = await api.post('tasks/group-create/', requestData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          savedTask = {
            ...(response.data?.tasks?.[0] || {}),
            title: `${formData.title} (${response.data?.created_count || 0} HOD assignments)`,
          };
        } else {
          const response = await api.post('tasks/', requestData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          savedTask = response.data;
        }
        if (isHodCreate) {
          await api.post('subtasks/', {
            task: savedTask.id,
            title: formData.title,
            description: formData.description,
            assigned_to: assignedFaculty,
            deadline: formData.deadline,
            status: 'ASSIGNED',
          });
        }
      }
      onTaskCreated(savedTask, !task);
      onClose();
    } catch (err) {
      console.error('Error processing task:', err);
      setError(formatApiError(err, 'Failed to process task. Check all fields.'));
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
      assigned_to_faculty: '',
      start_date: '',
      deadline: '',
      status: 'ASSIGNED',
      is_special: false,
      priority: 'MEDIUM'
    });
    setAttachment(null);
    setUsers([]);
    setFacultyUsers([]);
    setShowingAllHods(false);
    setShowingAllFaculty(false);
    setIsGroupTask(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: 'primary.main', pb: 1 }}>
          {task ? 'Edit Task Assignment' : 'Create New Task Assignment'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {isHodCreate && !currentUser?.department && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Your HOD account is not linked to a department. Please ask Admin to assign your department before creating Faculty tasks.
            </Alert>
          )}

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

            {isHodCreate ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  select fullWidth label="Assign to Faculty" required
                  value={formData.assigned_to_faculty}
                  onChange={(e) => setFormData({...formData, assigned_to_faculty: e.target.value})}
                  disabled={!currentUser?.department || fetchingData}
                  helperText={
                    !currentUser?.department
                      ? 'A department is required before assigning Faculty.'
                      : facultyUsers.length === 0 && !fetchingData
                        ? 'No active Faculty found. Add an active Faculty user first.'
                        : showingAllFaculty
                          ? 'No Faculty is linked to your department, so all active Faculty are shown.'
                          : 'Select the Faculty member who will complete this task'
                  }
                >
                  {facultyUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : (
              <>
                {canCreateGroupTask && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isGroupTask}
                          onChange={(event) => handleGroupTaskChange(event.target.checked)}
                        />
                      }
                      label="Group Task"
                    />
                    {isGroupTask && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        This task will be assigned to every active Department HOD at once.
                      </Alert>
                    )}
                  </Grid>
                )}

                {!isGroupTask && (
                  <>
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
                  </>
                )}
              </>
            )}

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

            <Grid item xs={12}>
              <input
                id="task-attachment-upload"
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                onChange={(event) => setAttachment(event.target.files?.[0] || null)}
              />
              <label htmlFor="task-attachment-upload">
                <Box
                  sx={{
                    p: 2.5,
                    border: '1.5px dashed #b7d5fb',
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    '&:hover': {
                      bgcolor: '#eaf3ff',
                      borderColor: '#2563eb',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <CloudUploadRounded sx={{ color: '#237dba' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#212b36' }}>
                        {attachment ? attachment.name : 'Upload supporting file'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        PDFs, images, documents, spreadsheets, presentations, text, or ZIP files
                      </Typography>
                    </Box>
                  </Box>
                  <Button component="span" variant="outlined" startIcon={<AttachFileRounded />}>
                    Choose File
                  </Button>
                </Box>
              </label>
              {task?.attachment && !attachment && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Existing attachment: {task.attachment.split('/').pop()}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || fetchingData || (isHodCreate && (!currentUser?.department || !formData.assigned_to_faculty))}
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
