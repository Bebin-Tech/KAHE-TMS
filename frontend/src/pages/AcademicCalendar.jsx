import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  AssignmentTurnedInRounded,
  CalendarMonthRounded,
  DeleteRounded,
  DeleteSweepRounded,
  EditRounded,
  EventAvailableRounded,
  FileUploadRounded,
  GroupsRounded,
  PersonRounded,
  TodayRounded,
} from '@mui/icons-material';
import api from '../api/axios';
import { getCurrentSession } from '../utils/session';
import { formatApiError } from '../utils/errors';

const activityTypes = [
  { value: 'SEMESTER_EXAM', label: 'Semester Examination' },
  { value: 'COLLEGE_EVENT', label: 'College Event' },
  { value: 'INAUGURATION', label: 'Inauguration Program' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'ACADEMIC_PROGRAM', label: 'Academic Program' },
  { value: 'INSTITUTIONAL_PROGRAM', label: 'Institutional Program' },
  { value: 'OTHER', label: 'Other' },
];

const getAcademicYear = () => {
  const now = new Date();
  const start = now.getMonth() >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
};

const emptyForm = () => ({
  title: '',
  description: '',
  activity_type: 'ACADEMIC_PROGRAM',
  academic_year: getAcademicYear(),
  start_date: '',
  end_date: '',
  department: '',
  assigned_to: '',
});

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getUserLabel = (user) => {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.username;
};

const AcademicCalendar = () => {
  const currentUser = getCurrentSession()?.session?.user || {};
  const canManage = ['ADMIN', 'DEAN'].includes(currentUser.role);
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [importHods, setImportHods] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [importData, setImportData] = useState({ academic_year: getAcademicYear(), department: '', assigned_to: '' });
  const [importFile, setImportFile] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingHods, setFetchingHods] = useState(false);
  const [fetchingImportHods, setFetchingImportHods] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState({ open: false, severity: 'success', text: '' });

  const academicYears = useMemo(() => {
    const base = new Set([getAcademicYear()]);
    events.forEach((event) => {
      if (event.academic_year) base.add(event.academic_year);
    });
    return Array.from(base).sort();
  }, [events]);

  const calendarStats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((event) => event.start_date && new Date(event.start_date) >= now).length;
    const assigned = events.filter((event) => Boolean(event.assigned_to)).length;
    const synced = events.filter((event) => Boolean(event.generated_task)).length;
    return { upcoming, assigned, synced };
  }, [events]);

  const showMessage = (text, severity = 'success') => {
    setMessage({ open: true, severity, text });
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('academic-calendar/', {
        params: { refresh: Date.now() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      setEvents(normalizeList(response.data));
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to load academic calendar.'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('departments/');
      setDepartments(normalizeList(response.data));
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to load departments.'), 'error');
    }
  }, []);

  const fetchHods = useCallback(async (departmentId, selectedId = '') => {
    if (!departmentId) {
      setHods([]);
      return;
    }

    setFetchingHods(true);
    try {
      const response = await api.get(`users/hods/?department=${departmentId}`);
      const departmentHods = normalizeList(response.data);
      setHods(departmentHods);
      if (selectedId && !departmentHods.some((user) => String(user.id) === String(selectedId))) {
        setFormData((current) => ({ ...current, assigned_to: '' }));
      }
    } catch (err) {
      setHods([]);
      showMessage(formatApiError(err, 'Unable to load HODs for this department.'), 'error');
    } finally {
      setFetchingHods(false);
    }
  }, []);

  const fetchImportHods = useCallback(async (departmentId) => {
    if (!departmentId) {
      setImportHods([]);
      return;
    }

    setFetchingImportHods(true);
    try {
      const response = await api.get(`users/hods/?department=${departmentId}`);
      setImportHods(normalizeList(response.data));
    } catch (err) {
      setImportHods([]);
      showMessage(formatApiError(err, 'Unable to load HODs for this department.'), 'error');
    } finally {
      setFetchingImportHods(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, [fetchDepartments, fetchEvents]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData(emptyForm());
    setHods([]);
    setDialogOpen(true);
  };

  const handleOpenImport = () => {
    setImportData({ academic_year: getAcademicYear(), department: '', assigned_to: '' });
    setImportFile(null);
    setImportHods([]);
    setImportDialogOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    const nextForm = {
      title: event.title || '',
      description: event.description || '',
      activity_type: event.activity_type || 'ACADEMIC_PROGRAM',
      academic_year: event.academic_year || getAcademicYear(),
      start_date: event.start_date ? event.start_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      department: event.department || '',
      assigned_to: event.assigned_to || '',
    };
    setFormData(nextForm);
    fetchHods(nextForm.department, nextForm.assigned_to);
    setDialogOpen(true);
  };

  const handleDepartmentChange = (departmentId) => {
    setFormData((current) => ({ ...current, department: departmentId, assigned_to: '' }));
    fetchHods(departmentId);
  };

  const handleImportDepartmentChange = (departmentId) => {
    setImportData((current) => ({ ...current, department: departmentId, assigned_to: '' }));
    fetchImportHods(departmentId);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      department: formData.department || null,
      assigned_to: formData.assigned_to || null,
      end_date: formData.end_date || null,
    };

    try {
      const response = editingEvent
        ? await api.patch(`academic-calendar/${editingEvent.id}/`, payload)
        : await api.post('academic-calendar/', payload);
      const savedEvent = response.data;
      setEvents((current) => [
        savedEvent,
        ...current.filter((row) => row.id !== savedEvent.id),
      ]);
      setDialogOpen(false);
      setEditingEvent(null);
      showMessage(editingEvent ? 'Calendar activity updated and task synced.' : 'Calendar activity saved and task assigned.');
      fetchEvents();
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to save calendar activity.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`academic-calendar/${deleteTarget.id}/`);
      setEvents((current) => current.filter((event) => event.id !== deleteTarget.id));
      setDeleteTarget(null);
      showMessage('Calendar activity and generated task removed.');
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to delete calendar activity.'), 'error');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await api.delete('academic-calendar/delete-all/');
      const deletedCount = response.data?.deleted_count || 0;
      setDeleteAllOpen(false);
      setEvents([]);
      showMessage(`${deletedCount} calendar entr${deletedCount === 1 ? 'y' : 'ies'} deleted successfully.`);
      fetchEvents();
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to delete all calendar entries.'), 'error');
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    if (!importFile) {
      showMessage('Choose an academic calendar Excel file before importing.', 'error');
      return;
    }

    setImporting(true);
    const requestData = new FormData();
    requestData.append('file', importFile);
    requestData.append('academic_year', importData.academic_year);
    requestData.append('department', importData.department);
    requestData.append('assigned_to', importData.assigned_to);

    try {
      const response = await api.post('academic-calendar/import-excel/', requestData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const created = response.data?.created_count || 0;
      const skipped = response.data?.skipped_count || 0;
      setImportDialogOpen(false);
      showMessage(`Imported ${created} activit${created === 1 ? 'y' : 'ies'} and skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}.`);
      fetchEvents();
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to import academic calendar.'), 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout title="Academic Calendar">
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 2.25, md: 3 },
          borderRadius: 3,
          border: '1px solid #cfe0f4',
          bgcolor: '#f8fbff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 22px 60px -46px rgba(15,23,42,0.42)',
          '&::after': {
            content: '""',
            position: 'absolute',
            right: -78,
            top: -90,
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: '32px solid rgba(37,99,235,0.12)',
          },
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: '#0f766e', fontWeight: 900, letterSpacing: 1.4 }}>Automated dean workflow</Typography>
              <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a', fontSize: { xs: '1.55rem', sm: '2.2rem' }, lineHeight: 1.1 }}>
                Academic Calendar
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, maxWidth: 720 }}>
                Plan academic-year activities and let the system create, assign, and track the linked HOD tasks automatically.
              </Typography>
            </Box>
          </Stack>
          {canManage && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}>
              {events.length > 0 && (
                <Button variant="outlined" color="error" startIcon={<DeleteSweepRounded />} onClick={() => setDeleteAllOpen(true)} sx={{ minWidth: 150, bgcolor: '#ffffff', fontWeight: 850 }}>
                  Delete All
                </Button>
              )}
              <Button variant="outlined" startIcon={<FileUploadRounded />} onClick={handleOpenImport} sx={{ minWidth: 160, bgcolor: '#ffffff', fontWeight: 850 }}>
                Import Excel
              </Button>
              <Button variant="contained" startIcon={<AddRounded />} onClick={handleOpenCreate} sx={{ minWidth: 180 }}>
                Add Activity
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          { label: 'Calendar Entries', value: events.length, icon: <CalendarMonthRounded />, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Upcoming', value: calendarStats.upcoming, icon: <TodayRounded />, color: '#0f766e', bg: '#f0fdfa' },
          { label: 'Assigned', value: calendarStats.assigned, icon: <GroupsRounded />, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Tasks Synced', value: calendarStats.synced, icon: <AssignmentTurnedInRounded />, color: '#b45309', bg: '#fffbeb' },
        ].map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item.label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #dbe5ef', bgcolor: '#ffffff', height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ width: 42, height: 42, bgcolor: item.bg, color: item.color }}>
                  {item.icon}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>{item.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1 }}>{item.value}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        {academicYears.map((year) => (
          <Chip key={year} icon={<EventAvailableRounded />} label={year} sx={{ bgcolor: '#ffffff', color: '#0f766e', fontWeight: 900, border: '1px solid #ccfbf1' }} />
        ))}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 2, border: '1px dashed #cbd5e1', bgcolor: '#f8fbff' }}>
          <CalendarMonthRounded sx={{ fontSize: 54, color: '#94a3b8', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>No academic calendar activities yet</Typography>
          <Typography variant="body2" color="text.secondary">Create an activity to generate and assign the related task automatically.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {events.map((event) => (
            <Grid item xs={12} md={6} xl={4} key={event.id}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 0,
                  borderRadius: 3,
                  border: '1px solid #dbe5ef',
                  bgcolor: '#ffffff',
                  overflow: 'hidden',
                  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#b7d5fb',
                    boxShadow: '0 18px 44px -34px rgba(15,23,42,0.5)',
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8fbff', borderBottom: '1px solid #e2e8f0' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                    <Chip size="small" label={event.activity_type_label || event.activity_type} sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 900 }} />
                    {canManage && (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(event)} sx={{ color: '#2563eb' }}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(event)}>
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Stack>
                </Box>
                <Stack spacing={1.6} sx={{ p: 2.25 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.2, color: '#0f172a' }}>{event.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.description || 'No additional description'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>Starts</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 850 }}>{formatDateTime(event.start_date)}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>Deadline</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 850 }}>{formatDateTime(event.end_date || event.start_date)}</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" icon={<PersonRounded />} label={event.assigned_to_name || 'Unassigned'} sx={{ bgcolor: '#f8fafc', fontWeight: 800 }} />
                    <Chip size="small" label={event.department_name || 'General'} sx={{ bgcolor: '#f8fafc', fontWeight: 800 }} />
                    <Chip size="small" label={`Task: ${event.generated_task_status || 'Pending'}`} sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 900 }} />
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxWidth: 820 } }}>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ px: 2.5, py: 2, bgcolor: '#f8fbff', borderBottom: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 42, height: 42, bgcolor: '#e0f2fe', color: '#2563eb' }}>
                <CalendarMonthRounded />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>{editingEvent ? 'Edit Calendar Activity' : 'Add Calendar Activity'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>This will sync directly into the task workflow.</Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2.5, bgcolor: '#ffffff', '& .MuiTextField-root': { bgcolor: '#ffffff' } }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField fullWidth required size="small" label="Activity Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField fullWidth required size="small" label="Academic Year" value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })} placeholder="2026-2027" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth required size="small" label="Activity Type" value={formData.activity_type} onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}>
                  {activityTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth required size="small" label="Department" value={formData.department} onChange={(e) => handleDepartmentChange(e.target.value)}>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="Assign to HOD / Section Head"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  disabled={!formData.department || fetchingHods}
                  helperText={formData.department && !fetchingHods && hods.length === 0 ? 'No active HOD is linked to this department.' : 'Only HODs from the selected department are shown.'}
                >
                  {hods.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{getUserLabel(user)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required size="small" type="datetime-local" label="Start Date" InputLabelProps={{ shrink: true }} value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="datetime-local" label="End Date / Deadline" InputLabelProps={{ shrink: true }} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} helperText="If empty, the task deadline uses the start date." />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} size="small" label="Details" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add exam, event, program, or institutional activity details" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.75, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
            <Button variant="outlined" color="inherit" onClick={() => setDialogOpen(false)} sx={{ bgcolor: '#ffffff', fontWeight: 800, minWidth: 100 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || fetchingHods} sx={{ fontWeight: 850, minWidth: 150 }}>
              {saving ? <CircularProgress size={22} color="inherit" /> : 'Save Activity'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxWidth: 620 } }}>
        <form onSubmit={handleImport}>
          <DialogTitle sx={{ px: 2.5, py: 2, bgcolor: '#f8fbff', borderBottom: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 42, height: 42, bgcolor: '#f0fdfa', color: '#0f766e' }}>
                <FileUploadRounded />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>Import Academic Calendar</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Date-wise activities will become assigned tasks automatically.</Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2.5, bgcolor: '#ffffff' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required size="small" label="Academic Year" value={importData.academic_year} onChange={(e) => setImportData({ ...importData, academic_year: e.target.value })} placeholder="2026-2027" />
              </Grid>
              <Grid item xs={12}>
                <TextField select fullWidth required size="small" label="Department" value={importData.department} onChange={(e) => handleImportDepartmentChange(e.target.value)}>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="Assign imported tasks to"
                  value={importData.assigned_to}
                  onChange={(e) => setImportData({ ...importData, assigned_to: e.target.value })}
                  disabled={!importData.department || fetchingImportHods}
                  helperText={importData.department && !fetchingImportHods && importHods.length === 0 ? 'No active HOD is linked to this department.' : 'Only HODs from the selected department are shown.'}
                >
                  {importHods.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{getUserLabel(user)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <input
                  id="academic-calendar-import"
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                />
                <label htmlFor="academic-calendar-import">
                  <Paper
                    component="span"
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1.5px dashed #b7d5fb',
                      bgcolor: '#f8fbff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{importFile ? importFile.name : 'Choose Excel file'}</Typography>
                      <Typography variant="caption" color="text.secondary">Supported formats: .xlsx, .xls</Typography>
                    </Box>
                    <FileUploadRounded sx={{ color: '#2563eb' }} />
                  </Paper>
                </label>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.75, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
            <Button variant="outlined" color="inherit" onClick={() => setImportDialogOpen(false)} sx={{ bgcolor: '#ffffff', fontWeight: 800, minWidth: 100 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={importing || fetchingImportHods} sx={{ fontWeight: 850, minWidth: 150 }}>
              {importing ? <CircularProgress size={22} color="inherit" /> : 'Import & Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Delete Calendar Activity</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete {deleteTarget?.title}? The generated task will be removed from active task lists.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogTitle sx={{ p: 0, bgcolor: '#fff7f7', borderBottom: '1px solid #fee2e2' }}>
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#fee2e2', color: '#dc2626' }}>
              <DeleteSweepRounded />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                Delete All Entries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This removes all visible calendar entries and generated tasks.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete all {events.length} calendar entr{events.length === 1 ? 'y' : 'ies'}? The linked tasks will also be removed from active task lists.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteAllOpen(false)} sx={{ bgcolor: '#ffffff', fontWeight: 850, minWidth: 100 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteSweepRounded />} onClick={handleDeleteAll} sx={{ fontWeight: 900, minWidth: 130 }}>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={message.open}
        autoHideDuration={3000}
        onClose={() => setMessage((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={message.severity} onClose={() => setMessage((current) => ({ ...current, open: false }))}>
          {message.text}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default AcademicCalendar;
