import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  NotesRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession, getStoredSession, setActiveRole } from '../utils/session';
import { formatApiError } from '../utils/errors';

const today = () => new Date().toISOString().slice(0, 10);

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
  const [formData, setFormData] = useState({ note_date: today(), content: '' });
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
    setFormData({ note_date: today(), content: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormData({
      note_date: note.note_date || today(),
      content: note.content || '',
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
              Save dated notes, review them later, and remove anything you no longer need.
            </Typography>
          </Box>
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
          {notes.map((note) => (
            <Grid item xs={12} md={6} lg={4} key={note.id}>
              <Paper
                sx={{
                  height: '100%',
                  p: 2.25,
                  borderRadius: 2,
                  border: '1px solid #d8e3f0',
                  bgcolor: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 18px 48px -42px rgba(15,23,42,0.5)',
                  '&:hover': { borderColor: '#9cc7fb', bgcolor: '#f8fbff' },
                }}
                onClick={() => setSelectedNote(note)}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#eaf3ff', color: '#237dba' }}>
                    <CalendarMonthRounded />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                      {formatDate(note.note_date)}
                    </Typography>
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
          ))}
        </Grid>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingNote(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px' } }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 900 }}>{editingNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.25} sx={{ pt: 0.5 }}>
              <TextField
                label="Date"
                type="date"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.note_date}
                onChange={(event) => setFormData((current) => ({ ...current, note_date: event.target.value }))}
              />
              <TextField
                label="Note Content"
                required
                fullWidth
                multiline
                minRows={6}
                value={formData.content}
                onChange={(event) => setFormData((current) => ({ ...current, content: event.target.value }))}
                placeholder="Type the note details here..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => { setDialogOpen(false); setEditingNote(null); }} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={22} color="inherit" /> : editingNote ? 'Update Note' : 'Save Note'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(selectedNote)} onClose={() => setSelectedNote(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '18px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Note Details</DialogTitle>
        <DialogContent dividers>
          {selectedNote && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Date</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{formatDate(selectedNote.note_date)}</Typography>
              </Box>
              {currentRole === 'ADMIN' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedNote.created_by_name || 'User'}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>Content</Typography>
                <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: 'pre-line', color: '#334155' }}>
                  {selectedNote.content}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedNote(null)} color="inherit">Close</Button>
          {canEdit && selectedNote && (
            <Button variant="outlined" startIcon={<EditRounded />} onClick={() => handleOpenEdit(selectedNote)}>
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
