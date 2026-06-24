import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography, Box,
  CircularProgress, Alert
} from '@mui/material';
import api from '../api/axios';

const CreateTaskDialog = ({ open, onClose, onTaskCreated }) => {
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHods, setFetchingHods] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to_hod: '',
    deadline: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    if (open) {
      fetchHods();
      setError('');
    }
  }, [open]);

  const fetchHods = async () => {
    setFetchingHods(true);
    try {
      const response = await api.get('users/hods/');
      setHods(response.data);
      if (response.data.length === 0) {
        setError('No HODs found in the system. Please create an HOD account first.');
      }
    } catch (err) {
      setError('Failed to fetch HOD list. Check your connection.');
    } finally {
      setFetchingHods(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await api.post('tasks/', {
        ...formData,
        created_by: user.id,
        status: 'ASSIGNED'
      });
      onTaskCreated();
      onClose();
      setFormData({ title: '', description: '', assigned_to_hod: '', deadline: '', priority: 'MEDIUM' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task. Check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: 'primary.main' }}>
          Create New Assignment
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Task Title" required variant="filled"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Detailed Instructions" multiline rows={3} required variant="filled"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Assign to HOD" required variant="filled"
                value={formData.assigned_to_hod}
                onChange={(e) => setFormData({...formData, assigned_to_hod: e.target.value})}
                disabled={fetchingHods || hods.length === 0}
              >
                {hods.map((hod) => (
                  <MenuItem key={hod.id} value={hod.id}>
                    {hod.first_name} {hod.last_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Priority" variant="filled"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Deadline Date & Time" type="datetime-local" required variant="filled"
                InputLabelProps={{ shrink: true }}
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || hods.length === 0}
            sx={{ px: 4, py: 1, borderRadius: '10px', fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTaskDialog;
