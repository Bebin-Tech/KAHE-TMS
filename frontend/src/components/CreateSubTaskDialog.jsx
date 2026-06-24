import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, CircularProgress
} from '@mui/material';
import api from '../api/axios';

const CreateSubTaskDialog = ({ open, onClose, taskId, onTaskCreated }) => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    deadline: '',
  });

  useEffect(() => {
    if (open) {
      fetchFaculty();
    }
  }, [open]);

  const fetchFaculty = async () => {
    setFetching(true);
    try {
      const response = await api.get('users/');
      setFaculty(response.data.filter(u => u.role === 'FACULTY'));
    } catch (err) {
      console.error('Error fetching Faculty:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('subtasks/', {
        ...formData,
        task: taskId,
        status: 'ASSIGNED'
      });
      onTaskCreated();
      onClose();
      setFormData({ title: '', description: '', assigned_to: '', deadline: '' });
    } catch (err) {
      console.error('Error creating subtask:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle className="font-bold">Assign Sub-Task to Faculty</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Sub-Task Title" required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Requirements / Description" multiline rows={3} required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Select Faculty Member" required
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                disabled={fetching}
              >
                {faculty.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.first_name} {f.last_name} ({f.username})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Target Deadline" type="datetime-local" required
                InputLabelProps={{ shrink: true }}
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Assign Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateSubTaskDialog;
