import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  CircularProgress,
  Slide,
  Snackbar,
  Grid,
  InputAdornment,
  Popper,
  Grow,
  ClickAwayListener
} from '@mui/material';
import {
  Edit,
  Delete,
  Search,
  Assignment,
  Group,
  Save,
  Cancel,
  Close,
  Refresh,
  MoreVert,
  FilterList,
  CalendarToday,
  ClearAll
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { trainerTasksAPI } from '../../../services/API/trainertasks';
import { AuthContext } from '../../../context/AuthContext';

const gradientBg = 'linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)';
const gradientHover = 'linear-gradient(135deg, #0F766E 0%, #0891B2 100%)';
const gradientShadow = '0 8px 24px rgba(13,148,136,0.35)';

/* ──────── Actions Menu ──────── */
const ActionsMenu = ({ task, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const docRef = useRef(task);
  const callbacksRef = useRef({ onView, onEdit, onDelete });
  docRef.current = task;
  callbacksRef.current = { onView, onEdit, onDelete };

  const handleToggle = (e) => { e.stopPropagation(); setOpen((p) => !p); };
  const handleClose = (e) => { if (anchorRef.current?.contains(e?.target)) return; setOpen(false); };
  const handleAction = (type) => (e) => {
    e.stopPropagation(); setOpen(false);
    const t = docRef.current, cbs = callbacksRef.current;
    setTimeout(() => { if (type === 'edit') cbs.onEdit(t); else if (type === 'delete') cbs.onDelete(t.Task_ID); }, 0);
  };

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle}
        sx={{ width: 36, height: 36, backgroundImage: open ? gradientBg : 'none', color: open ? '#fff' : '#94A3B8', '&:hover': { backgroundImage: gradientBg, bgcolor: 'transparent', color: '#fff' }, transition: 'all 0.2s ease' }}>
        <MoreVert sx={{ fontSize: 20 }} />
      </IconButton>
      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end" transition sx={{ zIndex: 1400 }}
        modifiers={[{ name: 'preventOverflow', enabled: true, options: { boundary: 'viewport', padding: 8 } }, { name: 'flip', enabled: true, options: { fallbackPlacements: ['top-end'] } }]}>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'right top' }}>
            <Paper elevation={0} sx={{ mt: 0.5, minWidth: 180, borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden', py: 0.5 }}>
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', px: 2, pt: 1, pb: 0.5, color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</Typography>
                  <Box onClick={handleAction('edit')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <Edit sx={{ fontSize: 18, color: '#6B7280' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155' }}>Edit Task</Typography>
                  </Box>
                  <Box onClick={handleAction('delete')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, cursor: 'pointer', mt: 0.5, borderTop: '1px solid #F1F5F9', '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <Delete sx={{ fontSize: 18, color: '#EF4444' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#EF4444' }}>DELETE</Typography>
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

/* ──────── Shimmer ──────── */
const TrainerTasksShimmer = ({ rows = 6 }) => (
  <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={1}><Skeleton variant="text" width={260} height={48} /><Skeleton variant="rectangular" width={90} height={28} sx={{ borderRadius: '14px' }} /></Box>
        <Skeleton variant="text" width={380} height={22} />
      </Box>
    </Box>
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
      <Skeleton variant="rectangular" width="100%" height={44} sx={{ borderRadius: '10px', mb: 2 }} />
      <Box display="flex" gap={2}>{[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" width="25%" height={40} sx={{ borderRadius: '10px' }} />)}</Box>
    </Paper>
    <Box display="flex" gap={2} mb={3}>{[1,2,3].map(i => <Paper key={i} elevation={0} sx={{ p: 2.5, flex: 1, borderRadius: '14px', border: '1px solid #E2E8F0' }}><Skeleton variant="text" width={40} height={36} /><Skeleton variant="text" width={80} height={18} /></Paper>)}</Box>
    <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <Table><TableHead><TableRow sx={{ bgcolor: '#F8FAFC' }}>{['TASK ID','BATCH CODE','SESSION ID','TASK CONTENT','DATE','ACTIONS'].map(h => <TableCell key={h}><Skeleton variant="text" width={80} /></TableCell>)}</TableRow></TableHead>
        <TableBody>{Array.from({ length: rows }).map((_, i) => <TableRow key={i}><TableCell><Skeleton variant="rectangular" width={50} height={26} sx={{ borderRadius: '8px' }} /></TableCell><TableCell><Skeleton width={100} /></TableCell><TableCell><Skeleton width={60} /></TableCell><TableCell><Skeleton width={250} /></TableCell><TableCell><Skeleton width={100} /></TableCell><TableCell align="center"><Skeleton variant="circular" width={36} height={36} sx={{ mx: 'auto' }} /></TableCell></TableRow>)}</TableBody></Table>
    </Paper>
  </Box>
);

const Transition = React.forwardRef(function Transition(props, ref) { return <Slide direction="up" ref={ref} {...props} />; });

/* ═══════════════════ MAIN ═══════════════════ */
const TrainerTasksList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, taskId: null });
  const [editDialog, setEditDialog] = useState({ open: false, task: null });
  const [editForm, setEditForm] = useState({ Task_Box: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filters — always visible
  const [filters, setFilters] = useState({ batch_code: '', session_id: '', start_date: '', end_date: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  const cardSx = { borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: 'none' };
  const filterInputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px', bgcolor: '#fff',
      '& fieldset': { borderColor: '#E2E8F0' },
      '&:hover fieldset': { borderColor: '#CBD5E1' },
      '&.Mui-focused fieldset': { borderColor: '#0D9488', borderWidth: 1.5 },
    },
    '& .MuiInputBase-input': { fontSize: '0.85rem' },
  };

  const formatTaskData = (task) => ({
    Task_ID: task.Task_ID || task.ID || task.id,
    Batch_Code: task.Batch_Code || task.batch_code || '',
    Batch_ID: task.Batch_ID || task.batch_id || '',
    Session_ID: task.Session_ID || task.session_id || '',
    Task_Content: task.Task_Content || task.Task_Box || task.task_box || '',
    Start_DateTime: task.Start_DateTime || null,
    End_DateTime: task.End_DateTime || null,
  });

  const fetchTasks = async (filterOverride = null) => {
    try {
      setError(null);
      if (!user?.id) { setError('Trainer ID not found. Please log in again.'); setLoading(false); setRefreshing(false); return; }
      const active = filterOverride !== null ? filterOverride : appliedFilters;
      const apiFilters = {};
      if (active.batch_code) apiFilters.batch_code = active.batch_code;
      if (active.session_id) apiFilters.session_id = active.session_id;
      if (active.start_date) apiFilters.start_date = active.start_date;
      if (active.end_date) apiFilters.end_date = active.end_date;

      const response = await trainerTasksAPI.getAllTasks(user.id, apiFilters);
      let data = [];
      if (Array.isArray(response)) data = response;
      else if (response?.data && Array.isArray(response.data)) data = response.data;
      else if (response?.tasks && Array.isArray(response.tasks)) data = response.tasks;
      setTasks(data.map(formatTaskData));
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks.');
      setSnackbar({ open: true, message: err.message || 'Failed to fetch tasks', severity: 'error' });
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (user?.id) fetchTasks(); }, [user?.id]);

  const handleFilterChange = (field) => (e) => setFilters((p) => ({ ...p, [field]: e.target.value }));
  const handleApplyFilters = () => { const a = { ...filters }; setAppliedFilters(a); setLoading(true); fetchTasks(a); };
  const handleClearFilters = () => { const c = { batch_code: '', session_id: '', start_date: '', end_date: '' }; setFilters(c); setAppliedFilters({}); setLoading(true); fetchTasks({}); };
  const removeOneFilter = (key) => { const u = { ...appliedFilters, [key]: '' }; setAppliedFilters(u); setFilters((p) => ({ ...p, [key]: '' })); setLoading(true); fetchTasks(u); };
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const handleRefresh = async () => { setRefreshing(true); await fetchTasks(); };
  const handleView = (taskId) => { if (!taskId) return; navigate(`/trainer/tasks/view/${taskId}`); };
  const handleEdit = (task) => { setEditForm({ Task_Box: task.Task_Content || '' }); setEditDialog({ open: true, task }); };
  const handleEditClose = () => { setEditDialog({ open: false, task: null }); setEditForm({ Task_Box: '' }); };
  const handleEditFormChange = (field) => (e) => setEditForm((p) => ({ ...p, [field]: e.target.value }));
  const handleEditSubmit = async () => {
    try { setEditLoading(true); await trainerTasksAPI.updateTask(editDialog.task.Task_ID, editForm.Task_Box, user.id); setTasks((p) => p.map((t) => t.Task_ID === editDialog.task.Task_ID ? { ...t, Task_Content: editForm.Task_Box } : t)); handleEditClose(); setSnackbar({ open: true, message: 'Task updated successfully!', severity: 'success' });
    } catch (err) { setSnackbar({ open: true, message: err.message || 'Failed to update task', severity: 'error' }); } finally { setEditLoading(false); }
  };
  const handleDelete = (taskId) => setDeleteDialog({ open: true, taskId });
  const confirmDelete = async () => {
    try { await trainerTasksAPI.deleteTask(deleteDialog.taskId, user.id); setTasks((p) => p.filter((t) => t.Task_ID !== deleteDialog.taskId)); setDeleteDialog({ open: false, taskId: null }); setSnackbar({ open: true, message: 'Task deleted successfully', severity: 'success' });
    } catch (err) { setSnackbar({ open: true, message: err.message || 'Failed to delete task', severity: 'error' }); setDeleteDialog({ open: false, taskId: null }); }
  };
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (task.Task_Content || '').toLowerCase().includes(s) || (task.Batch_Code || '').toLowerCase().includes(s) || (task.Task_ID && task.Task_ID.toString().includes(s)) || (task.Session_ID && task.Session_ID.toString().includes(s));
  });

  const uniqueBatches = [...new Set(tasks.map((t) => t.Batch_Code).filter(Boolean))];
  const uniqueSessions = [...new Set(tasks.map((t) => t.Session_ID).filter(Boolean))];

  if (loading) return <TrainerTasksShimmer rows={8} />;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '10px' }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* ═══════════ HEADER ═══════════ */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={0.5}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '2rem', letterSpacing: '-0.02em' }}>Trainer Tasks</Typography>
            <Chip label={`${filteredTasks.length} TASKS`} size="small" sx={{ backgroundImage: gradientBg, color: '#fff', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.04em', height: 26, borderRadius: '13px', '& .MuiChip-label': { px: 1.5 }, '&::before': { content: '""', width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.5)', display: 'inline-block', mr: 0.6, ml: -0.2 } }} />
            <IconButton onClick={handleRefresh} disabled={refreshing} sx={{ width: 34, height: 34, color: '#94A3B8', '&:hover': { bgcolor: '#F1F5F9', color: '#0D9488' } }} title="Refresh">
              <Refresh sx={{ fontSize: 20, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.9rem', maxWidth: 480, lineHeight: 1.5 }}>View and manage task assignments for training batches and sessions.</Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', border: '1px solid #FECACA' }} onClose={() => setError(null)}
          action={<Button color="inherit" size="small" onClick={handleRefresh} sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Retry</Button>}>{error}</Alert>
      )}

      {/* ═══════════ SEARCH + FILTERS (always visible) ═══════════ */}
      <Paper elevation={0} sx={{ ...cardSx, p: 2.5, mb: 3 }}>
        {/* Row 1: Search + Refresh */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
          <TextField
            placeholder="Search by Task ID, Batch Code, Session ID, or content..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC', '& fieldset': { borderColor: '#E2E8F0' }, '&:hover fieldset': { borderColor: '#CBD5E1' }, '&.Mui-focused fieldset': { borderColor: '#0D9488', borderWidth: 1.5 } },
              '& .MuiInputBase-input': { fontSize: '0.875rem' },
            }}
          />
          <Button variant="text" startIcon={<Refresh sx={{ fontSize: 18, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />}
            onClick={handleRefresh} disabled={refreshing}
            sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: '10px', px: 2, flexShrink: 0, '&:hover': { bgcolor: '#F1F5F9' } }}>
            Refresh
          </Button>
        </Box>

        {/* Divider */}
        <Box sx={{ borderTop: '1px solid #F1F5F9', pt: 2 }}>
          {/* Row 2: Filter fields */}
          <Grid container spacing={2} alignItems="flex-end">
            {/* Batch Code */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#64748B', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Batch Code</Typography>
              <TextField fullWidth size="small" placeholder="e.g. BATCH-2025-FSWD-01" value={filters.batch_code} onChange={handleFilterChange('batch_code')}
                InputProps={{ startAdornment: <InputAdornment position="start"><Group sx={{ fontSize: 16, color: '#94A3B8' }} /></InputAdornment> }}
                sx={filterInputSx}
              />
            </Grid>
            {/* Session ID */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#64748B', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Session ID</Typography>
              <TextField fullWidth size="small" type="number" placeholder="e.g. 11" value={filters.session_id} onChange={handleFilterChange('session_id')} inputProps={{ min: 1 }}
                sx={filterInputSx}
              />
            </Grid>
            {/* From Date */}
            <Grid item xs={12} sm={6} md={2.5}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#64748B', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>From Date</Typography>
              <TextField fullWidth size="small" type="date" value={filters.start_date} onChange={handleFilterChange('start_date')}
                sx={filterInputSx}
              />
            </Grid>
            {/* To Date */}
            <Grid item xs={12} sm={6} md={2.5}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#64748B', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>To Date</Typography>
              <TextField fullWidth size="small" type="date" value={filters.end_date} onChange={handleFilterChange('end_date')}
                sx={filterInputSx}
              />
            </Grid>
            {/* Apply + Clear */}
            <Grid item xs={12} sm={12} md={2}>
              <Box display="flex" gap={1}>
                <Button fullWidth variant="contained" onClick={handleApplyFilters} startIcon={<Search sx={{ fontSize: 18 }} />}
                  sx={{ backgroundImage: gradientBg, bgcolor: 'transparent', borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', py: 1, boxShadow: gradientShadow, '&:hover': { backgroundImage: gradientHover, bgcolor: 'transparent' } }}>
                  Apply
                </Button>
                {activeFilterCount > 0 && (
                  <IconButton onClick={handleClearFilters} title="Clear all filters"
                    sx={{ width: 40, height: 40, borderRadius: '10px', border: '1px solid #E2E8F0', color: '#EF4444', flexShrink: 0, '&:hover': { bgcolor: '#FEF2F2', borderColor: '#FECACA' } }}>
                    <ClearAll sx={{ fontSize: 20 }} />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <Box display="flex" gap={1} flexWrap="wrap" mt={2} pt={1.5} sx={{ borderTop: '1px solid #F1F5F9' }}>
            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, mr: 0.5, alignSelf: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active:</Typography>
            {appliedFilters.batch_code && <Chip label={`Batch: ${appliedFilters.batch_code}`} size="small" onDelete={() => removeOneFilter('batch_code')} sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: '8px', '& .MuiChip-deleteIcon': { fontSize: 14, color: '#16A34A' } }} />}
            {appliedFilters.session_id && <Chip label={`Session: ${appliedFilters.session_id}`} size="small" onDelete={() => removeOneFilter('session_id')} sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA', borderRadius: '8px', '& .MuiChip-deleteIcon': { fontSize: 14, color: '#EA580C' } }} />}
            {appliedFilters.start_date && <Chip label={`From: ${appliedFilters.start_date}`} size="small" onDelete={() => removeOneFilter('start_date')} sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', '& .MuiChip-deleteIcon': { fontSize: 14, color: '#2563EB' } }} />}
            {appliedFilters.end_date && <Chip label={`To: ${appliedFilters.end_date}`} size="small" onDelete={() => removeOneFilter('end_date')} sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', '& .MuiChip-deleteIcon': { fontSize: 14, color: '#2563EB' } }} />}
          </Box>
        )}
      </Paper>

      {/* ═══════════ SUMMARY CARDS ═══════════ */}
      <Box display="flex" gap={2} mb={3}>
        <Paper elevation={0} sx={{ ...cardSx, p: 2.5, flex: 1, transition: 'all 0.2s ease', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' } }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Assignment sx={{ color: '#2563EB', fontSize: 22 }} /></Box>
            <Box><Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', lineHeight: 1 }}>{tasks.length}</Typography><Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Total Tasks</Typography></Box>
          </Box>
        </Paper>
        <Paper elevation={0} sx={{ ...cardSx, p: 2.5, flex: 1, transition: 'all 0.2s ease', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' } }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Group sx={{ color: '#16A34A', fontSize: 22 }} /></Box>
            <Box><Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', lineHeight: 1 }}>{uniqueBatches.length}</Typography><Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Batches</Typography></Box>
          </Box>
        </Paper>
        <Paper elevation={0} sx={{ ...cardSx, p: 2.5, flex: 1, transition: 'all 0.2s ease', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' } }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FilterList sx={{ color: '#EA580C', fontSize: 22 }} /></Box>
            <Box><Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', lineHeight: 1 }}>{uniqueSessions.length}</Typography><Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Sessions</Typography></Box>
          </Box>
        </Paper>
      </Box>

      {/* ═══════════ TABLE ═══════════ */}
      <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC', '& .MuiTableCell-head': { color: '#94A3B8', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #E2E8F0', py: 1.8 } }}>
                <TableCell sx={{ width: 100, pl: 3 }}>Task ID</TableCell>
                <TableCell sx={{ width: 140 }}>Batch Code</TableCell>
                <TableCell sx={{ width: 110 }}>Session ID</TableCell>
                <TableCell>Task Content</TableCell>
                <TableCell sx={{ width: 140 }}>Session Date</TableCell>
                <TableCell sx={{ width: 80, textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ borderBottom: 'none' }}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Box sx={{ mb: 2, fontSize: 48, opacity: 0.4 }}>📋</Box>
                      <Typography variant="h6" sx={{ color: '#334155', fontWeight: 600 }} gutterBottom>No Tasks Found</Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', mb: 3, maxWidth: 400, mx: 'auto' }}>
                        {tasks.length === 0 && activeFilterCount > 0 ? 'No tasks match your filters. Try adjusting or clearing them.' : tasks.length === 0 ? 'No tasks found. Tasks are created from the Session detail view.' : 'No tasks match your search.'}
                      </Typography>
                      {activeFilterCount > 0 && tasks.length === 0 && (
                        <Button variant="outlined" startIcon={<ClearAll />} onClick={handleClearFilters} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#64748B' }}>Clear Filters</Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.Task_ID} sx={{ cursor: 'default', transition: 'all 0.15s ease', '&:hover': { bgcolor: '#F8FAFC', '& .task-id-chip': { backgroundImage: gradientBg, color: '#fff', borderColor: 'transparent' } }, '& .MuiTableCell-root': { borderBottom: '1px solid #F1F5F9', py: 2 } }}>
                    <TableCell sx={{ pl: 3 }}>
                      <Chip className="task-id-chip" label={`#${task.Task_ID}`} variant="outlined" size="small" sx={{ fontWeight: 700, fontSize: '0.8rem', borderColor: '#E2E8F0', color: '#0D9488', borderRadius: '8px', height: 28, transition: 'all 0.15s ease', '& .MuiChip-label': { px: 1 } }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '8px', bgcolor: '#F0FDF4' }}><Group sx={{ fontSize: 16, color: '#16A34A' }} /></Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{task.Batch_Code || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748B' }}>{task.Session_ID}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1E293B', wordBreak: 'break-word', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
                        {task.Task_Content || <Box component="span" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>No content</Box>}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>{task.Start_DateTime || '—'}</Typography></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><ActionsMenu task={task} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ═══════════ EDIT MODAL ═══════════ */}
      <Dialog open={editDialog.open} onClose={handleEditClose} TransitionComponent={Transition} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.12)' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Assignment sx={{ color: '#2563EB', fontSize: 20 }} /></Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>Edit Task Content<Typography component="span" sx={{ color: '#94A3B8', fontWeight: 500, ml: 1, fontSize: '0.85rem' }}>ID: {editDialog.task?.Task_ID}</Typography></Typography>
            </Box>
            <IconButton onClick={handleEditClose} disabled={editLoading} size="small" sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}><Close sx={{ fontSize: 18 }} /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#F1F5F9', p: 3 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', lineHeight: 1.8 }}>
                <strong style={{ color: '#334155' }}>Task ID:</strong> {editDialog.task?.Task_ID} &nbsp;|&nbsp;
                <strong style={{ color: '#334155' }}>Batch:</strong> {editDialog.task?.Batch_Code || editDialog.task?.Batch_ID} &nbsp;|&nbsp;
                <strong style={{ color: '#334155' }}>Session:</strong> {editDialog.task?.Session_ID}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>Batch and Session cannot be changed after creation.</Typography>
            </Box>
            <TextField fullWidth label="Task Content" value={editForm.Task_Box} onChange={handleEditFormChange('Task_Box')} variant="outlined" multiline rows={6} disabled={editLoading}
              helperText="Enter the task questions or content" placeholder="What is python?, what are array?"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& fieldset': { borderColor: '#E2E8F0' }, '&:hover fieldset': { borderColor: '#CBD5E1' }, '&.Mui-focused fieldset': { borderColor: '#0D9488' } } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={handleEditClose} variant="outlined" disabled={editLoading} startIcon={<Cancel />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, borderColor: '#E2E8F0', color: '#64748B', px: 3, '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' } }}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" disabled={editLoading} startIcon={editLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            sx={{ backgroundImage: gradientBg, bgcolor: 'transparent', borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 4px 14px rgba(13,148,136,0.3)', '&:hover': { backgroundImage: gradientHover, bgcolor: 'transparent' }, '&.Mui-disabled': { backgroundImage: 'none', bgcolor: '#94A3B8', color: '#fff' } }}>
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════ DELETE DIALOG ═══════════ */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, taskId: null })} PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.12)', maxWidth: 420 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Delete sx={{ color: '#EF4444', fontSize: 20 }} /></Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent><Typography sx={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6 }}>Are you sure you want to delete this task? This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, taskId: null })} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, color: '#64748B', px: 3 }}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" sx={{ bgcolor: '#EF4444', borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 4px 14px rgba(239,68,68,0.3)', '&:hover': { bgcolor: '#DC2626' } }}>Delete Task</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainerTasksList;