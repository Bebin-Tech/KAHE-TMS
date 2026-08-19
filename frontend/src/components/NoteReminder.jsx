import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {
  EventAvailableRounded,
  NotificationsActiveRounded,
  NotesRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return 'Today';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const buildReminderKey = (userId, notes) => {
  const ids = notes.map((note) => note.id).sort((a, b) => a - b).join(',');
  return `tms_note_reminder:${userId}:${todayKey()}:${ids}`;
};

const NoteReminder = () => {
  const navigate = useNavigate();
  const currentSession = getCurrentSession();
  const user = currentSession?.session?.user;
  const [dueNotes, setDueNotes] = useState([]);
  const [open, setOpen] = useState(false);

  const reminderKey = useMemo(
    () => (user?.id && dueNotes.length ? buildReminderKey(user.id, dueNotes) : ''),
    [dueNotes, user?.id]
  );

  const fetchDueNotes = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await api.get('notes/due-today/', {
        params: { refresh: Date.now() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const notes = Array.isArray(response.data) ? response.data : [];
      setDueNotes(notes);

      if (!notes.length) return;

      const key = buildReminderKey(user.id, notes);
      if (sessionStorage.getItem(key) !== 'dismissed') {
        setOpen(true);
      }
    } catch (err) {
      setDueNotes([]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDueNotes();
    const intervalId = window.setInterval(fetchDueNotes, 15 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [fetchDueNotes]);

  const handleDismiss = () => {
    if (reminderKey) sessionStorage.setItem(reminderKey, 'dismissed');
    setOpen(false);
  };

  const handleOpenNotes = () => {
    handleDismiss();
    navigate(user?.role === 'ADMIN' ? '/admin-notes' : '/notes');
  };

  if (!dueNotes.length) return null;

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 30px 80px -48px rgba(15,23,42,0.55)',
        },
      }}
    >
      <DialogTitle sx={{ p: 0, bgcolor: '#f0fdfa', borderBottom: '1px solid #ccfbf1' }}>
        <Box sx={{ p: { xs: 2.25, sm: 3 }, display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: '#ccfbf1', color: '#0f766e', width: 48, height: 48 }}>
            <NotificationsActiveRounded />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
              Note Alert
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {dueNotes.length} enabled alert{dueNotes.length === 1 ? '' : 's'} for today.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2.25, sm: 3 }, bgcolor: '#ffffff' }}>
        <Stack spacing={1.4}>
          {dueNotes.slice(0, 4).map((note) => (
            <Box
              key={note.id}
              sx={{
                p: 1.75,
                borderRadius: 2,
                border: '1px solid #dbe7f5',
                bgcolor: '#f8fbff',
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <EventAvailableRounded sx={{ mt: 0.25, color: '#0f766e' }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 900 }}>
                    {formatDate(note.note_date)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.35,
                      color: '#0f172a',
                      whiteSpace: 'pre-line',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {note.content}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
          {dueNotes.length > 4 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              +{dueNotes.length - 4} more reminder{dueNotes.length - 4 === 1 ? '' : 's'} in Notes.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, gap: 1, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={handleDismiss} color="inherit">
          Remind Later
        </Button>
        <Button variant="contained" startIcon={<NotesRounded />} onClick={handleOpenNotes}>
          Open Notes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoteReminder;
