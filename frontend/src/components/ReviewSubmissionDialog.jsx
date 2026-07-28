import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Divider,
  CircularProgress
} from '@mui/material';
import { GetAppRounded } from '@mui/icons-material';
import api from '../api/axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';
const fileBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
const getFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${fileBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const ReviewSubmissionDialog = ({ open, onClose, task, onProcessed }) => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch latest submission for this subtask or task
      const endpoint = task.type === 'subtask'
        ? `submissions/?subtask=${task.id}`
        : `submissions/?task=${task.id}`;
      const res = await api.get(endpoint);
      setSubmission(res.data[res.data.length - 1]);
    } catch (err) {
      console.error('Error fetching submission:', err);
    } finally {
      setLoading(false);
    }
  }, [task]);

  useEffect(() => {
    if (open && task) {
      fetchSubmission();
    }
  }, [fetchSubmission, open, task]);

  const handleAction = async (action) => {
    setProcessing(true);
    try {
      if (task.type === 'subtask') {
        const endpoint = action === 'approve' ? 'approve_by_hod' : 'reject_by_hod';
        await api.post(`subtasks/${task.id}/${endpoint}/`, { feedback });
      } else {
        const endpoint = action === 'approve' ? 'approve_as_dean' : 'reject_as_dean';
        await api.post(`tasks/${task.id}/${endpoint}/`, { feedback });
      }
      onProcessed();
      onClose();
    } catch (err) {
      console.error('Error processing review:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Review Submission</DialogTitle>
      <DialogContent dividers>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : (
          submission ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="primary">
                {task.type === 'subtask' ? 'FACULTY COMMENTS' : 'HOD SUBMISSION SUMMARY'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>{submission.content}</Typography>

              {submission.attachment && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{submission.attachment.split('/').pop()}</Typography>
                  <Button
                    startIcon={<GetAppRounded />}
                    href={getFileUrl(submission.attachment)}
                    target="_blank"
                    rel="noreferrer"
                    size="small"
                  >
                    Download
                  </Button>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <TextField
                fullWidth label="Your Feedback / Rejection Reason"
                multiline rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Required for rejections..."
              />
            </Box>
          ) : <Typography align="center" sx={{ py: 4 }}>No submission data found.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => handleAction('reject')}
          disabled={processing || !submission}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => handleAction('approve')}
          disabled={processing || !submission}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewSubmissionDialog;
