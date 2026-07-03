import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import api from '../api/axios';
import { getCurrentSession, redirectPathForUser, updateRoleUser } from '../utils/session';

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

      // Update stored user info for only the active role session.
      const current = getCurrentSession();
      const user = updateRoleUser(current?.role, (storedUser) => ({
        ...storedUser,
        must_change_password: false,
      })) || {};

      // Redirect based on role
      navigate(redirectPathForUser(user));
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f4f7fb',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef6ff 48%, #f4f7fb 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          width: '100%',
          maxWidth: 460,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 26px 70px -48px rgba(15,23,42,0.55)'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>Security Update</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.5 }}>
          For your security, you must change your password before continuing.
        </Typography>

        {error && (
          <Alert
            severity="error"
            variant="filled"
            sx={{
              mb: 4,
              borderRadius: 2,
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
          />
          <TextField
            fullWidth label="New Password" type="password" required
            variant="outlined"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            fullWidth label="Confirm New Password" type="password" required
            variant="outlined"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit" variant="contained" size="large"
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: 800,
              color: '#ffffff',
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

