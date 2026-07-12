import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { redirectPathForUser, saveRoleSession } from '../utils/session';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  PersonOutline,
  LockOutlined,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const redirectByRole = (user) => {
    navigate(redirectPathForUser(user));
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('token/', {
        username: email.trim(),
        password: password.trim(),
      });

      const { access, refresh, user } = response.data;

      saveRoleSession({ access, refresh, user });
      redirectByRole(user);

    } catch (err) {
      console.error('Login Error:', err);
      if (!err.response) {
        setError('Connection failed. Please check if the server is running.');
      } else if (err.response.status === 401) {
        setError('Invalid username/email or password.');
      } else if (err.response.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="min-h-screen flex flex-col items-center justify-center p-4"
      sx={{
        bgcolor: '#f4f7fb',
        py: { xs: 3, sm: 4 },
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef6ff 48%, #f4f7fb 100%)'
      }}
    >
      <Paper
        elevation={0}
        className="w-full max-w-[400px] flex flex-col items-center bg-white"
        sx={{
          p: { xs: 3, sm: 4 },
          mx: 'auto',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 26px 70px -48px rgba(15,23,42,0.55)'
        }}
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Box
            component="img"
            src="/logo.png"
            alt="KAHE Logo"
            sx={{
              height: { xs: 88, sm: 120 },
              width: 'auto',
              mb: 2,
              objectFit: 'contain'
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.75 }}>
            KAHE TMS
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Sign in to your account
          </Typography>
        </div>

        {/* Error Message */}
        {error && (
          <Box
            className="w-full mb-6 py-2 px-4 rounded-md text-center border animate-pulse"
            sx={{
              backgroundColor: '#fff1f2',
              color: '#b91c1c',
              borderColor: '#fee2e2',
              fontSize: '0.875rem',
              fontWeight: 720
            }}
          >
            {error}
          </Box>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <TextField
            fullWidth
            placeholder="Username or Email"
            variant="outlined"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutline sx={{ color: '#2563eb', fontSize: 20 }} />
                </InputAdornment>
              ),
              className: "bg-white"
            }}
          />

          <TextField
            fullWidth
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined sx={{ color: '#2563eb', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                    size="small"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff sx={{ color: '#94a3b8', fontSize: 20 }} /> : <Visibility sx={{ color: '#94a3b8', fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              ),
              className: "bg-white"
            }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            className="text-white py-3 normal-case font-bold text-lg mt-4"
            sx={{
              mt: 2,
              color: '#ffffff',
              height: '52px'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: '#9aa3af', fontWeight: 700 }}>
            Beta v2.5.1
          </Typography>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;

