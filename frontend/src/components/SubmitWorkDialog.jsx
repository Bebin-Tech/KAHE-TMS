import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, CircularProgress,
  IconButton, Paper, Alert, Stack, Avatar
} from '@mui/material';
import { AssignmentTurnedInRounded, CloudUploadRounded, CloseRounded } from '@mui/icons-material';
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ p: 3, bgcolor: '#f8fbff', borderBottom: '1px solid #e7edf5' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#dbeafe', color: '#2563eb' }}>
              <AssignmentTurnedInRounded />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>Submit Completed Work</Typography>
              <Typography variant="body2" color="text.secondary">Send your completed work to the HOD for review.</Typography>
            </Box>
            <IconButton onClick={onClose} size="small"><CloseRounded /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a clear completion summary and attach any supporting files, reports, or documents.
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
              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderStyle: 'dashed',
                  borderRadius: 2,
                  borderColor: file ? '#2563eb' : '#b7d5fb',
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
                  PDF, images, documents, spreadsheets, presentations, text, or ZIP files
                </Typography>
              </Paper>
            </label>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fbff', gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ px: 4, borderRadius: 1.5, fontWeight: 850 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit to HOD'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SubmitWorkDialog;
