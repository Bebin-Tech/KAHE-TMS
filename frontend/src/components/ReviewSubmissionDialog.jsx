import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Divider,
  Alert,
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
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const isSubtaskReview = task?.type === 'subtask';

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch latest submission for this subtask or task
      const endpoint = isSubtaskReview
        ? `submissions/?subtask=${task.id}`
        : `submissions/?task=${task.id}`;
      const res = await api.get(endpoint);
      setSubmission(res.data[res.data.length - 1]);
    } catch (err) {
      console.error('Error fetching submission:', err);
    } finally {
      setLoading(false);
    }
  }, [isSubtaskReview, task]);

  useEffect(() => {
    if (open && task) {
      fetchSubmission();
    }
  }, [fetchSubmission, open, task]);

  const handleAction = async (action) => {
    setError('');
    if (action === 'reject' && !feedback.trim()) {
      setError(isSubtaskReview ? 'Please enter a rejection reason before sending this work back.' : 'Please enter a rework reason before sending this task back to the HOD.');
      return;
    }

    setProcessing(true);
    try {
      if (isSubtaskReview) {
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
      setError(err.response?.data?.error || 'Unable to process this review. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{isSubtaskReview ? 'Review Faculty Submission' : 'Dean Verification Review'}</DialogTitle>
      <DialogContent dividers>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : (
          submission ? (
            <Box>
              {error && (
                <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              <Typography variant="subtitle2" gutterBottom color="primary">
                {isSubtaskReview ? 'FACULTY COMMENTS' : 'HOD SUBMISSION SUMMARY'}
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
                fullWidth label={isSubtaskReview ? 'Feedback / Rejection Reason' : 'Verification Feedback / Rework Reason'}
                multiline rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={isSubtaskReview ? 'Required when rejecting faculty work...' : 'Required when sending this task back to the HOD...'}
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
          {isSubtaskReview ? 'Reject' : 'Reject & Send Back'}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => handleAction('approve')}
          disabled={processing || !submission}
        >
          {isSubtaskReview ? 'Approve' : 'Mark Verified'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewSubmissionDialog;
