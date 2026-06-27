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
      const response = await api.post('users/change_password/', {
        old_password: oldPassword,
        new_password: newPassword
      });

      console.log('Password update successful:', response.data.message);

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
      console.error('Password Update Error:', err);
      if (!err.response) {
        setError('Network error: Could not reach the server. Please ensure the backend is running.');
      } else {
        const msg = err.response?.data?.error || err.response?.data?.detail || `Error ${err.response?.status}: Failed to update password.`;
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f6f6f7', p: 2 }}>
      <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, width: '100%', maxWidth: 450, borderRadius: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>Security Update</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.5 }}>
          For your security, you must change your password before continuing.
        </Typography>

        {error && (
          <Alert
            severity="error"
            variant="filled"
            sx={{
              mb: 4,
              borderRadius: '12px',
              bgcolor: '#fff1f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              '& .MuiAlert-icon': { color: '#ef4444' }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <TextField
            fullWidth label="Current Password" type="password" required
            variant="outlined"
            value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField
            fullWidth label="New Password" type="password" required
            variant="outlined"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField
            fullWidth label="Confirm New Password" type="password" required
            variant="outlined"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Button
            type="submit" variant="contained" size="large"
            disabled={loading}
            sx={{
              mt: 2,
              py: 2,
              fontWeight: 800,
              borderRadius: '12px',
              bgcolor: '#3B8FF3',
              color: '#1E1E2C',
              '&:hover': { bgcolor: '#237dba', color: 'white' },
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ChangePassword;

