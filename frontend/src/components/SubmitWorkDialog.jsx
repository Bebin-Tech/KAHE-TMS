import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, CircularProgress,
  IconButton, Paper, Alert
} from '@mui/material';
import { CloudUploadRounded, CloseRounded } from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';
import { formatApiError } from '../utils/errors';

const SubmitWorkDialog = ({ open, onClose, subtaskId, onSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('subtask', subtaskId);
    formData.append('content', content);
    if (file) formData.append('attachment', file);

    const user = getCurrentSession()?.session?.user;
    formData.append('submitted_by', user?.id);

    try {
      await api.post('submissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update subtask status via specialized action
      await api.post(`subtasks/${subtaskId}/submit_to_hod/`);

      onSubmitted();
      onClose();
      setContent('');
      setFile(null);
    } catch (err) {
      console.error('Submission error:', err);
      setError(formatApiError(err, 'Failed to submit work. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Submit Completed Work
          <IconButton onClick={onClose} size="small"><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload your final reports or documents and add a summary of the work completed.
          </Typography>
          {error && (
            <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth label="Submission Comments" multiline rows={4} required
            placeholder="Describe what you have completed..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderStyle: 'dashed',
                  bgcolor: '#f8fafc',
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f1f5f9', borderColor: 'primary.main' }
                }}
              >
                <CloudUploadRounded sx={{ fontSize: '3rem', color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {file ? file.name : 'Click to upload attachment'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF, DOCX, or ZIP files accepted
                </Typography>
              </Paper>
            </label>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ px: 4, borderRadius: '10px', fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit to HOD'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SubmitWorkDialog;
