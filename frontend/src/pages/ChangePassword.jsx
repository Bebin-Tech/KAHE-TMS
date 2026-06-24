import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import api from '../api/axios';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('users/change_password/', {
        old_password: oldPassword,
        new_password: newPassword
      });

      // Update stored user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.must_change_password = false;
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      const routes = {
        'ADMIN': '/admin-dashboard',
        'DEAN': '/dean-dashboard',
        'HOD': '/hod-dashboard',
        'FACULTY': '/faculty-dashboard'
      };
      navigate(routes[user.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f7f9' }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Security Update</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          For your security, you must change your password before continuing.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            fullWidth label="Current Password" type="password" required
            value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
          />
          <TextField
            fullWidth label="New Password" type="password" required
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            fullWidth label="Confirm New Password" type="password" required
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit" variant="contained" size="large"
            disabled={loading} sx={{ mt: 2, py: 1.5, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ChangePassword;
