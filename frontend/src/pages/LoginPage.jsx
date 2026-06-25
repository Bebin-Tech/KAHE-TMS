import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
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

  // Redirect if already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (localStorage.getItem('access_token') && user.role) {
      redirectByRole(user);
    }
  }, []);

  const redirectByRole = (user) => {
    if (user.must_change_password) {
      navigate('/change-password');
      return;
    }
    const routes = {
      'DEAN': '/dean-dashboard',
      'HOD': '/hod-dashboard',
      'FACULTY': '/faculty-dashboard',
      'ADMIN': '/admin-dashboard'
    };
    navigate(routes[user.role] || '/login');
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

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Login successful:', user.username);
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
    <Box className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7f9] p-4">
      <Paper
        elevation={0}
        className="w-full max-w-[400px] p-8 rounded-[20px] flex flex-col items-center shadow-sm bg-white"
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Box
            component="img"
            src="/logo.png"
            alt="KAHE Logo"
            sx={{
              height: 120,
              width: 'auto',
              mb: 2,
              objectFit: 'contain'
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0066b2', mb: 1, letterSpacing: '0.5px' }}>
            KAHE TMS
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-1">
            Sign in to your account
          </Typography>
        </div>

        {/* Error Message */}
        {error && (
          <Box
            className="w-full mb-6 py-2 px-4 rounded-md text-center border animate-pulse"
            sx={{
              backgroundColor: '#fff1f2',
              color: '#f43f5e',
              borderColor: '#fee2e2',
              fontSize: '0.875rem',
              fontWeight: '700',
              letterSpacing: '0.05em'
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
                  <PersonOutline sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
              className: "rounded-[10px] bg-white"
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#0066b2' },
                '&.Mui-focused fieldset': { borderColor: '#0066b2' },
              }
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
                  <LockOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
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
              className: "rounded-[10px] bg-[#eff4ff]"
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#0066b2' },
                '&.Mui-focused fieldset': { borderColor: '#0066b2' },
              }
            }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            className="bg-[#0066b2] hover:bg-[#005291] text-white py-3 rounded-lg normal-case font-bold text-lg mt-4 shadow-none"
            sx={{
              mt: 2,
              textTransform: 'none',
              backgroundColor: '#0066b2',
              '&:hover': { backgroundColor: '#005291' },
              height: '52px'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>
      </Paper>

      {/* Footer */}
      <Typography variant="caption" className="mt-8 text-gray-400 font-medium">
        Beta V 2.5.1
      </Typography>
    </Box>
  );
};

export default LoginPage;
