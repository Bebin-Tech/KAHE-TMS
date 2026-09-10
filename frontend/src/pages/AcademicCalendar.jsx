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

const getDateKeyFromValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const dateKeyToInputValue = (dateKey, time = '09:00') => `${dateKey}T${time}`;

const columnLetterToIndex = (letters) => letters.split('').reduce((total, letter) => (
  total * 26 + letter.toUpperCase().charCodeAt(0) - 64
), 0);

const parseCellRef = (ref) => {
  const match = /^([A-Z]+)(\d+)$/i.exec(ref || '');
  if (!match) return null;
  return {
    column: columnLetterToIndex(match[1]),
    row: Number(match[2]),
  };
};

const buildMergeLookup = (ranges = []) => ranges.reduce((lookup, range) => {
  const [startRef, endRef = startRef] = range.split(':');
  const start = parseCellRef(startRef);
  const end = parseCellRef(endRef);
  if (!start || !end) return lookup;

  const nextLookup = { ...lookup };
  nextLookup[`${start.row}:${start.column}`] = {
    colSpan: end.column - start.column + 1,
    rowSpan: end.row - start.row + 1,
  };
  for (let row = start.row; row <= end.row; row += 1) {
    for (let column = start.column; column <= end.column; column += 1) {
      if (row === start.row && column === start.column) continue;
      nextLookup[`${row}:${column}`] = { hidden: true };
    }
  }
  return nextLookup;
}, {});

const excelColumnWidthToPx = (width) => {
  const numericWidth = Number(width || 12);
  return Math.max(48, Math.min(Math.round(numericWidth * 7.4 + 6), 360));
};

const excelRowHeightToPx = (height) => {
  if (!height) return undefined;
  return Math.max(24, Math.round(Number(height) * 1.33));
};

const getLayoutTableWidth = (columns = []) => {
  const total = columns.reduce((sum, column) => sum + excelColumnWidthToPx(column.width), 0);
  return Math.max(total, 1180);
};

const getCellBackground = (cell, hasValue) => {
  if (cell.fill) return cell.fill;
  return hasValue ? '#ffffff' : '#fbfdff';
};

const shouldHighlightAssignedDateCell = (row, cell, ref, assignedTaskDateKeys) => (
  Boolean(row.date_key && assignedTaskDateKeys.has(row.date_key) && ref?.column === 1 && cell.value)
);

const parseAcademicYearStart = (academicYear) => {
  const match = /^(\d{4})/.exec(academicYear || '');
  return match ? Number(match[1]) : new Date().getFullYear();
};

const parseDateCellValue = (value) => {
  const text = String(value || '').trim();
  const match = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  if (!day || !month || !year) return null;
  return { day, month, year };
};

const getMonthFromText = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const index = monthNames.findIndex((month) => text.startsWith(month));
  return index >= 0 ? index + 1 : null;
};

const makeDateKey = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '';
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const deriveCalendarRows = (layout, academicYear) => {
  let currentMonth = null;
  let currentYear = parseAcademicYearStart(academicYear);
  const yearStart = currentYear;

  return (layout?.rows || []).map((row) => {
    if (row.date_key) return row;

    const firstValue = row.cells?.[0]?.value;
    const parsedDate = parseDateCellValue(firstValue);
    const monthFromText = getMonthFromText(firstValue);

    if (parsedDate) {
      currentMonth = parsedDate.month;
      currentYear = parsedDate.year;
      return row;
    }

    if (monthFromText) {
      currentMonth = monthFromText;
      currentYear = monthFromText >= 5 ? yearStart : yearStart + 1;
      return row;
    }

    const numericDay = Number(firstValue);
    if (!Number.isInteger(numericDay) || !currentMonth) return row;

    const dateKey = makeDateKey(currentYear, currentMonth, numericDay);
    if (!dateKey) return row;

    return {
      ...row,
      date_key: dateKey,
      day_name: row.day_name || String(row.cells?.[1]?.value || '').trim(),
      particulars: row.particulars || String(row.cells?.[2]?.value || '').trim(),
    };
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
  const [calendarImports, setCalendarImports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [importData, setImportData] = useState({ academic_year: getAcademicYear() });
  const [importFile, setImportFile] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteImportedOpen, setDeleteImportedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingHods, setFetchingHods] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState({ open: false, severity: 'success', text: '' });

  const academicYears = useMemo(() => {
    const base = new Set([getAcademicYear()]);
    events.forEach((event) => {
      if (event.academic_year) base.add(event.academic_year);
    });
    calendarImports.forEach((calendarImport) => {
      if (calendarImport.academic_year) base.add(calendarImport.academic_year);
    });
    return Array.from(base).sort();
  }, [calendarImports, events]);

  const calendarStats = useMemo(() => {
    const now = new Date();
    const actionableEvents = events.filter((event) => event.source !== 'EXCEL_IMPORT' || event.assigned_to || event.generated_task);
    const upcoming = actionableEvents.filter((event) => event.start_date && new Date(event.start_date) >= now).length;
    const assigned = actionableEvents.filter((event) => Boolean(event.assigned_to)).length;
    const released = actionableEvents.filter((event) => event.release_status === 'RELEASED' || event.task_released_at).length;
    const imported = events.filter((event) => event.source === 'EXCEL_IMPORT').length;
    const importedRows = calendarImports.reduce((total, item) => (
      total + deriveCalendarRows(item.layout, item.academic_year).filter((row) => row.date_key && row.particulars).length
    ), 0);
    return { upcoming, assigned, released, imported: importedRows || imported };
  }, [calendarImports, events]);

  const workflowEvents = useMemo(() => (
    events.filter((event) => event.source !== 'EXCEL_IMPORT' || event.assigned_to || event.generated_task)
  ), [events]);

  const assignedTaskDateKeys = useMemo(() => new Set(
    workflowEvents
      .filter((event) => event.assigned_to && event.start_date)
      .map((event) => getDateKeyFromValue(event.start_date))
      .filter(Boolean)
  ), [workflowEvents]);

  const selectedCalendarImport = calendarImports[0] || null;
  const selectedCalendarRows = useMemo(() => (
    deriveCalendarRows(selectedCalendarImport?.layout, selectedCalendarImport?.academic_year)
  ), [selectedCalendarImport]);
  const importMergeLookup = useMemo(() => (
    buildMergeLookup(selectedCalendarImport?.layout?.merged_ranges || [])
  ), [selectedCalendarImport]);

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

  const fetchCalendarImports = useCallback(async () => {
    try {
      const response = await api.get('academic-calendar/imports/', {
        params: { refresh: Date.now() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      setCalendarImports(normalizeList(response.data));
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to load imported academic calendar.'), 'error');
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

  useEffect(() => {
    fetchEvents();
    fetchCalendarImports();
    fetchDepartments();
  }, [fetchCalendarImports, fetchDepartments, fetchEvents]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData(emptyForm());
    setHods([]);
    setDialogOpen(true);
  };

  const handleOpenCreateFromImportedRow = (row) => {
    if (!row?.date_key || !canManage) return;
    setEditingEvent(null);
    setFormData({
      ...emptyForm(),
      title: row.particulars || '',
      description: row.particulars ? `From academic calendar: ${row.particulars}` : '',
      start_date: dateKeyToInputValue(row.date_key, '09:00'),
      end_date: dateKeyToInputValue(row.date_key, '17:00'),
    });
    setHods([]);
    setDialogOpen(true);
  };

  const handleOpenImport = () => {
    setImportData({ academic_year: getAcademicYear() });
    setImportFile(null);
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
      showMessage(editingEvent ? 'Calendar activity updated and task schedule synced.' : 'Calendar activity saved. The task will be sent on its scheduled date.');
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
      fetchCalendarImports();
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to delete all calendar entries.'), 'error');
    }
  };

  const handleDeleteImported = async () => {
    try {
      const response = await api.delete('academic-calendar/delete-imported/');
      const deletedCount = response.data?.deleted_count || 0;
      setDeleteImportedOpen(false);
      setEvents((current) => current.filter((event) => event.source !== 'EXCEL_IMPORT'));
      setCalendarImports([]);
      showMessage(`${deletedCount} imported calendar entr${deletedCount === 1 ? 'y' : 'ies'} deleted successfully.`);
      fetchEvents();
      fetchCalendarImports();
    } catch (err) {
      showMessage(formatApiError(err, 'Unable to delete imported academic calendar.'), 'error');
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

    try {
      const response = await api.post('academic-calendar/import-excel/', requestData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const rowCount = response.data?.calendar_row_count || 0;
      setImportDialogOpen(false);
      showMessage(`Imported academic calendar with ${rowCount} date-wise entr${rowCount === 1 ? 'y' : 'ies'}. Select a date to create and assign a task.`);
      fetchEvents();
      fetchCalendarImports();
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
                Plan academic-year activities, assign the responsible HOD, and let the system send the task on the scheduled date.
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
                Import Calendar
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
          { label: 'Calendar Entries', value: calendarStats.imported + workflowEvents.length, icon: <CalendarMonthRounded />, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Upcoming', value: calendarStats.upcoming, icon: <TodayRounded />, color: '#0f766e', bg: '#f0fdfa' },
          { label: 'Assigned', value: calendarStats.assigned, icon: <GroupsRounded />, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Imported Entries', value: calendarStats.imported, icon: <FileUploadRounded />, color: '#b45309', bg: '#fffbeb' },
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

      {!loading && selectedCalendarImport && (
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            borderRadius: 3,
            border: '1px solid #dbe5ef',
            bgcolor: '#ffffff',
            overflow: 'hidden',
            boxShadow: '0 18px 50px -44px rgba(15,23,42,0.45)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ px: { xs: 1.75, md: 2.25 }, py: 1.75, bgcolor: '#f8fbff', borderBottom: '1px solid #e2e8f0' }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 950, color: '#0f172a', lineHeight: 1.15 }}>
                Imported Academic Calendar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCalendarImport.file_name} - {selectedCalendarImport.layout?.sheet_name || 'Calendar sheet'} - {selectedCalendarImport.academic_year}
              </Typography>
              {canManage && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.35, color: '#1d4ed8', fontWeight: 850 }}>
                  Click any date/day row to create and assign a task for that selected date.
                </Typography>
              )}
            </Box>
            {canManage && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<DeleteSweepRounded />}
                onClick={() => setDeleteImportedOpen(true)}
                sx={{ bgcolor: '#ffffff', fontWeight: 850, minWidth: 170 }}
              >
                Delete Imported
              </Button>
            )}
          </Stack>
          <Box sx={{ overflow: 'auto', maxHeight: 620, bgcolor: '#ffffff' }}>
            <Box
              component="table"
              sx={{
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                minWidth: getLayoutTableWidth(selectedCalendarImport.layout?.columns || []),
                width: '100%',
                '& td': {
                  border: '1px solid #dbe5ef',
                  px: 0.55,
                  py: 0.35,
                  fontSize: '0.78rem',
                  lineHeight: 1.2,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                  whiteSpace: 'pre-wrap',
                },
              }}
            >
              <colgroup>
                {(selectedCalendarImport.layout?.columns || []).map((column) => (
                  <Box
                    key={column.letter}
                    component="col"
                    sx={{ width: excelColumnWidthToPx(column.width) }}
                  />
                ))}
              </colgroup>
              <tbody>
                {selectedCalendarRows.map((row) => (
                  <tr
                    key={row.index}
                    style={{
                      height: excelRowHeightToPx(row.height),
                      cursor: canManage && row.date_key ? 'pointer' : 'default',
                    }}
                    title={canManage && row.date_key ? 'Click to create a task for this date' : undefined}
                    onClick={() => handleOpenCreateFromImportedRow(row)}
                  >
                    {(row.cells || []).map((cell) => {
                      const ref = parseCellRef(cell.ref);
                      const merge = ref ? importMergeLookup[`${ref.row}:${ref.column}`] : null;
                      if (merge?.hidden) return null;
                      const hasValue = Boolean(cell.value);
                      const clickableDateCell = canManage && row.date_key && ref?.column <= 3;
                      const assignedDateCell = shouldHighlightAssignedDateCell(row, cell, ref, assignedTaskDateKeys);
                      return (
                        <Box
                          key={cell.ref}
                          component="td"
                          colSpan={merge?.colSpan || 1}
                          rowSpan={merge?.rowSpan || 1}
                          onClick={() => handleOpenCreateFromImportedRow(row)}
                          sx={{
                            bgcolor: getCellBackground(cell, hasValue),
                            color: cell.color || '#0f172a',
                            fontWeight: cell.bold ? 900 : 500,
                            fontStyle: cell.italic ? 'italic' : 'normal',
                            fontSize: cell.font_size ? `${Math.max(10, Math.min(Number(cell.font_size) * 1.05, 24))}px` : undefined,
                            textAlign: ['center', 'right', 'left'].includes(cell.align) ? cell.align : 'center',
                            verticalAlign: ['top', 'middle', 'bottom'].includes(cell.vertical_align) ? cell.vertical_align : 'middle',
                            whiteSpace: cell.wrap_text ? 'pre-wrap' : 'normal',
                            overflowWrap: 'anywhere',
                            minHeight: 24,
                            ...(clickableDateCell && {
                              bgcolor: hasValue ? '#eff6ff' : getCellBackground(cell, hasValue),
                              color: '#1d4ed8',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textDecorationColor: '#bfdbfe',
                            }),
                          }}
                        >
                          {assignedDateCell ? (
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 28,
                                height: 28,
                                px: 0.75,
                                borderRadius: '999px',
                                border: '2px solid #16a34a',
                                bgcolor: '#dcfce7',
                                color: '#166534',
                                fontWeight: 950,
                                lineHeight: 1,
                              }}
                            >
                              {cell.value}
                            </Box>
                          ) : cell.value}
                        </Box>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : workflowEvents.length === 0 ? (
        <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 2, border: '1px dashed #cbd5e1', bgcolor: '#f8fbff' }}>
          <CalendarMonthRounded sx={{ fontSize: 54, color: '#94a3b8', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>No assigned calendar tasks yet</Typography>
          <Typography variant="body2" color="text.secondary">Select a date in the imported calendar or add an activity to create the first scheduled task.</Typography>
        </Paper>
      ) : (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950, color: '#0f172a', lineHeight: 1.25 }}>
                Scheduled Workflow Entries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activities created from selected calendar dates and assigned for delivery.
              </Typography>
            </Box>
            <Chip
              size="small"
              label={`${workflowEvents.length} ${workflowEvents.length === 1 ? 'entry' : 'entries'}`}
              sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 900 }}
            />
          </Stack>
          <Grid container spacing={2}>
            {workflowEvents.map((event) => (
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
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={event.activity_type_label || event.activity_type} sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 900 }} />
                        {event.source === 'EXCEL_IMPORT' && (
                          <Chip size="small" label="Imported" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 900 }} />
                        )}
                        <Chip
                          size="small"
                          label={event.release_status === 'RELEASED' ? 'Released' : 'Scheduled'}
                          sx={{
                            bgcolor: event.release_status === 'RELEASED' ? '#ecfdf5' : '#fffbeb',
                            color: event.release_status === 'RELEASED' ? '#047857' : '#b45309',
                            fontWeight: 900,
                          }}
                        />
                      </Stack>
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
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.2, color: '#0f172a' }}>{event.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.description || 'No additional description'}
                      </Typography>
                    </Box>

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
                      <Chip
                        size="small"
                        label={event.release_status === 'RELEASED' ? `Task: ${event.generated_task_status || 'Assigned'}` : 'Task will send on date'}
                        sx={{
                          bgcolor: event.release_status === 'RELEASED' ? '#ecfdf5' : '#fffbeb',
                          color: event.release_status === 'RELEASED' ? '#047857' : '#b45309',
                          fontWeight: 900,
                        }}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
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
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>The linked task will be sent automatically on the selected date.</Typography>
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
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Upload the Excel calendar to display its original date-wise structure in the system.</Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2.5, bgcolor: '#ffffff' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required size="small" label="Academic Year" value={importData.academic_year} onChange={(e) => setImportData({ ...importData, academic_year: e.target.value })} placeholder="2026-2027" />
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
            <Button type="submit" variant="contained" disabled={importing} sx={{ fontWeight: 850, minWidth: 150 }}>
              {importing ? <CircularProgress size={22} color="inherit" /> : 'Import Calendar'}
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

      <Dialog open={deleteImportedOpen} onClose={() => setDeleteImportedOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogTitle sx={{ p: 0, bgcolor: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#fef3c7', color: '#b45309' }}>
              <FileUploadRounded />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                Delete Imported Calendar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This removes only entries created from Excel import.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete {calendarStats.imported} imported calendar entr{calendarStats.imported === 1 ? 'y' : 'ies'}? The linked generated tasks will also be removed from active task lists.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteImportedOpen(false)} sx={{ bgcolor: '#ffffff', fontWeight: 850, minWidth: 100 }}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" startIcon={<DeleteSweepRounded />} onClick={handleDeleteImported} sx={{ fontWeight: 900, minWidth: 150 }}>
            Delete Imported
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
