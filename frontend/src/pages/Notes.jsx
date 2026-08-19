import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  CalendarMonthRounded,
  DeleteRounded,
  EditRounded,
  NotificationsActiveRounded,
  NotesRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession, getStoredSession, setActiveRole } from '../utils/session';
import { formatApiError } from '../utils/errors';

const today = () => new Date().toISOString().slice(0, 10);

const isTodayAlert = (note) => note.note_date === today() && Boolean(note.reminder_enabled);

const formatDate = (value) => {
  if (!value) return 'No date';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const normalizeNotes = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const Notes = () => {
  const isAdminNotesRoute = window.location.pathname === '/admin-notes';
  if (isAdminNotesRoute) setActiveRole('ADMIN');
  const currentSession = isAdminNotesRoute
    ? { role: 'ADMIN', session: getStoredSession('ADMIN') }
    : getCurrentSession();
  const currentUser = currentSession?.session?.user || {};
  const currentRole = currentUser.role || currentSession?.role;
  const [notes, setNotes] = useState([]);
  const [modulePermissions, setModulePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ note_date: today(), content: '', reminder_enabled: false });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, severity: 'success', message: '' });

  const notesPermission = useMemo(
    () => modulePermissions.find((permission) => permission.module === 'notes'),
    [modulePermissions]
  );
  const canView = currentRole === 'ADMIN' || Boolean(notesPermission?.can_access || notesPermission?.can_view);
  const canEdit = currentRole === 'ADMIN' || Boolean(notesPermission?.can_edit);
  const canCreate = canEdit;
  const canDelete = currentRole === 'ADMIN' || Boolean(notesPermission?.can_delete);
  const dueTodayCount = notes.filter(isTodayAlert).length;

  const showMessage = (message, severity = 'success') => {
    setNotification({ open: true, severity, message });
  };

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await api.get('user-module-permissions/mine/');
      setModulePermissions(response.data || []);
    } catch (err) {
      console.error('Error fetching note permissions:', err);
      setModulePermissions([]);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('notes/', {
        params: { refresh: Date.now() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const nextNotes = normalizeNotes(response.data);
      setNotes(nextNotes);
      return nextNotes;
    } catch (err) {
      console.error('Error fetching notes:', err);
      showMessage(formatApiError(err, 'Unable to load notes.'), 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchNotes();
  }, [fetchNotes, fetchPermissions]);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormData({ note_date: today(), content: '', reminder_enabled: false });
    setDialogOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormData({
      note_date: note.note_date || today(),
      content: note.content || '',
      reminder_enabled: Boolean(note.reminder_enabled),
    });
    setSelectedNote(null);
    setDialogOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = editingNote
        ? await api.patch(`notes/${editingNote.id}/`, formData)
        : await api.post('notes/', formData);
      const savedNote = response.data;
      setDialogOpen(false);
      setEditingNote(null);
      if (savedNote?.id) {
        setNotes((current) => [
          savedNote,
          ...current.filter((note) => note.id !== savedNote.id),
        ]);
      }
      showMessage(editingNote ? 'Note updated successfully.' : 'Note saved successfully.');
      const refreshedNotes = await fetchNotes();
      if (savedNote?.id && refreshedNotes.length === 0) {
        setNotes([savedNote]);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      showMessage(formatApiError(err, 'Unable to save note.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`notes/${deleteTarget.id}/`);
      setNotes((current) => current.filter((note) => note.id !== deleteTarget.id));
      setDeleteTarget(null);
      if (selectedNote?.id === deleteTarget.id) setSelectedNote(null);
      showMessage('Note deleted successfully.');
    } catch (err) {
      console.error('Error deleting note:', err);
      if (err.response?.status === 404) {
        setNotes((current) => current.filter((note) => note.id !== deleteTarget.id));
        setDeleteTarget(null);
        if (selectedNote?.id === deleteTarget.id) setSelectedNote(null);
        showMessage('Note was already removed.');
        return;
      }
      showMessage(formatApiError(err, 'Unable to delete note.'), 'error');
    }
  };

  if (!loading && !canView) {
    return (
      <DashboardLayout title="Notes">
        <Paper sx={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, border: '1px solid #dde5f0' }}>
          <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
            <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: '#eaf3ff', color: '#237dba' }}>
              <NotesRounded />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Notes Access Required</Typography>
            <Typography variant="body2" color="text.secondary">
              Ask Admin to enable Notes access from User Access Management.
            </Typography>
          </Box>
        </Paper>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notes">
      <Paper elevation={0} sx={{ mb: 3, p: { xs: 2.5, md: 3 }, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ color: '#237dba', fontWeight: 900 }}>Long-term notes</Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, fontSize: { xs: '1.55rem', sm: '2rem' } }}>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Save events, functions, important tasks, and daily work by date. Turn on the alert only for notes that need a reminder.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Chip
              icon={<NotificationsActiveRounded />}
              label={`${dueTodayCount} alert${dueTodayCount === 1 ? '' : 's'} today`}
              sx={{
                bgcolor: dueTodayCount ? '#ccfbf1' : '#f1f5f9',
                color: dueTodayCount ? '#0f766e' : '#64748b',
                fontWeight: 900,
                justifyContent: 'center',
              }}
            />
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={handleOpenCreate}
                sx={{ alignSelf: { xs: 'stretch', md: 'center' }, minWidth: 160 }}
              >
                Create Note
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : notes.length === 0 ? (
        <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 2, border: '1px dashed #cbd5e1', bgcolor: '#f8fbff' }}>
          <NotesRounded sx={{ fontSize: 52, color: '#94a3b8', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>No notes saved yet</Typography>
          <Typography variant="body2" color="text.secondary">Create a note to keep useful information available for later.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {notes.map((note) => {
            const dueToday = isTodayAlert(note);
            return (
            <Grid item xs={12} md={6} lg={4} key={note.id}>
              <Paper
                sx={{
                  height: '100%',
                  p: 2.25,
                  borderRadius: 2,
                  border: dueToday ? '1px solid #5eead4' : '1px solid #d8e3f0',
                  bgcolor: dueToday ? '#f0fdfa' : '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 18px 48px -42px rgba(15,23,42,0.5)',
                  '&:hover': { borderColor: '#9cc7fb', bgcolor: '#f8fbff' },
                }}
                onClick={() => setSelectedNote(note)}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: dueToday ? '#ccfbf1' : '#eaf3ff', color: dueToday ? '#0f766e' : '#237dba' }}>
                    {dueToday ? <NotificationsActiveRounded /> : <CalendarMonthRounded />}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                        {formatDate(note.note_date)}
                      </Typography>
                      {dueToday && (
                        <Chip
                          label="Alert today"
                          size="small"
                          sx={{ bgcolor: '#ccfbf1', color: '#0f766e', fontWeight: 900, borderRadius: 1.5 }}
                        />
                      )}
                    </Stack>
                    {currentRole === 'ADMIN' && (
                      <Typography variant="caption" color="text.secondary">
                        Created by {note.created_by_name || 'User'}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {note.content}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View note">
                      <IconButton size="small" onClick={(event) => { event.stopPropagation(); setSelectedNote(note); }}>
                        <VisibilityRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canEdit && (
                      <Tooltip title="Edit note">
                        <IconButton color="primary" size="small" onClick={(event) => { event.stopPropagation(); handleOpenEdit(note); }}>
                          <EditRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete note">
                        <IconButton color="error" size="small" onClick={(event) => { event.stopPropagation(); setDeleteTarget(note); }}>
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingNote(null);
        }}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 620 },
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle
            sx={{
              px: 2.5,
              py: 2,
              bgcolor: '#f8fbff',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 40, height: 40, bgcolor: '#dbeafe', color: '#2563eb' }}>
                <NotesRounded />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                  {editingNote ? 'Edit Note' : 'Create Note'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Add dated work, events, or optional alerts.
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: 2.5, py: 2.25, bgcolor: '#ffffff' }}>
            <Stack spacing={1.6}>
              <TextField
                label="Date"
                type="date"
                required
                fullWidth
                size="small"
                helperText="Select a date for this note."
                InputLabelProps={{ shrink: true }}
                value={formData.note_date}
                onChange={(event) => setFormData((current) => ({ ...current, note_date: event.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f8fbff',
                    fontWeight: 800,
                  },
                }}
              />
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={Boolean(formData.reminder_enabled)}
                    onChange={(event) => setFormData((current) => ({ ...current, reminder_enabled: event.target.checked }))}
                  />
                )}
                label="Enable alert for this note"
                sx={{
                  m: 0,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: 2,
                  border: '1px solid #dbe7f5',
                  bgcolor: formData.reminder_enabled ? '#f0fdfa' : '#f8fbff',
                  '& .MuiFormControlLabel-label': {
                    fontWeight: 850,
                    color: formData.reminder_enabled ? '#0f766e' : '#475569',
                  },
                }}
              />
              {formData.reminder_enabled && (
                <Box
                sx={{
                  px: 1.35,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: '#f0fdfa',
                  border: '1px solid #ccfbf1',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <NotificationsActiveRounded sx={{ color: '#0f766e', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 800 }}>
                  Alert will appear on the selected date.
                </Typography>
              </Box>
              )}
              <TextField
                label="Note Content"
                required
                fullWidth
                multiline
                minRows={4}
                maxRows={6}
                value={formData.content}
                onChange={(event) => setFormData((current) => ({ ...current, content: event.target.value }))}
                placeholder="Event, function, important task, or daily work..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fbfdff',
                    alignItems: 'flex-start',
                  },
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 2, gap: 1.25, bgcolor: '#f8fbff', borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => { setDialogOpen(false); setEditingNote(null); }}
              variant="outlined"
              color="inherit"
              sx={{ bgcolor: '#ffffff', minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ minWidth: 124 }}>
              {saving ? <CircularProgress size={22} color="inherit" /> : editingNote ? 'Update Note' : 'Save Note'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(selectedNote)}
        onClose={() => setSelectedNote(null)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 620 },
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: '#f8fbff',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#dbeafe', color: '#2563eb' }}>
              <NotesRounded />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                Note Details
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Review the saved reminder note.
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, py: 2.25, bgcolor: '#ffffff' }}>
          {selectedNote && (
            <Stack spacing={1.6}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.6,
                  borderRadius: 2,
                  bgcolor: isTodayAlert(selectedNote) ? '#f0fdfa' : '#f8fbff',
                  border: isTodayAlert(selectedNote) ? '1px solid #ccfbf1' : '1px solid #dbe7f5',
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Avatar sx={{ bgcolor: isTodayAlert(selectedNote) ? '#ccfbf1' : '#dbeafe', color: isTodayAlert(selectedNote) ? '#0f766e' : '#2563eb' }}>
                    {isTodayAlert(selectedNote) ? <NotificationsActiveRounded /> : <CalendarMonthRounded />}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 900 }}>Date</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                      {formatDate(selectedNote.note_date)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: selectedNote.reminder_enabled ? '#0f766e' : '#64748b', fontWeight: 800 }}>
                      {selectedNote.reminder_enabled ? 'Alert enabled' : 'No alert enabled'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
              {currentRole === 'ADMIN' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedNote.created_by_name || 'User'}</Typography>
                </Box>
              )}
              <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2, border: '1px solid #dbe7f5', bgcolor: '#fbfdff' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 900, mb: 0.75 }}>Content</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.7 }}>
                  {selectedNote.content}
                </Typography>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 2, gap: 1.25, bgcolor: '#f8fbff', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setSelectedNote(null)} variant="outlined" color="inherit" sx={{ bgcolor: '#ffffff', minWidth: 100 }}>Close</Button>
          {canEdit && selectedNote && (
            <Button variant="outlined" startIcon={<EditRounded />} onClick={() => handleOpenEdit(selectedNote)} sx={{ bgcolor: '#ffffff', minWidth: 100 }}>
              Edit
            </Button>
          )}
          {canDelete && selectedNote && (
            <Button color="error" variant="contained" startIcon={<DeleteRounded />} onClick={() => setDeleteTarget(selectedNote)}>
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Delete Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this note? It will no longer appear in the Notes module.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" startIcon={<DeleteRounded />}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={3500}
        onClose={() => setNotification((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((current) => ({ ...current, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default Notes;
