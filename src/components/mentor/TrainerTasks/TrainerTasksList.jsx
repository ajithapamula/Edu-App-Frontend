import React, { useState, useEffect, useContext } from 'react';
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
  Tooltip,
  Skeleton,
  CircularProgress,
  Slide,
  Snackbar,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Visibility,
  Edit,
  Search,
  Assignment,
  Group,
  Save,
  Cancel,
  Close,
  Refresh,
  FilterList,
  CalendarToday
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { trainerTasksAPI } from '../../../services/API/trainertasks';
import { AuthContext } from '../../../context/AuthContext';

/* ── inject fonts + keyframes ── */
const styleTag = document.getElementById('tt-list-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'tt-list-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes ttFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ttSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ── design tokens ── */
const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const card = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };
const accent = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: '#fff',
  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.85rem',
  textTransform: 'none', borderRadius: '10px', px: 2.5, py: 1,
  boxShadow: '0 4px 14px rgba(14,165,233,0.25)', border: 'none',
  '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)', boxShadow: '0 6px 20px rgba(14,165,233,0.30)', transform: 'translateY(-1px)' },
  transition: 'all 0.3s ease',
};
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', background: '#f8fafc',
    '& fieldset': { borderColor: '#e8ecf2' },
    '&:hover fieldset': { borderColor: '#bfdbfe' },
    '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { fontFamily: '"DM Sans", sans-serif', color: '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0ea5e9' },
};
const selectSx = {
  borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', background: '#f8fafc',
  '& fieldset': { borderColor: '#e8ecf2' },
  '&:hover fieldset': { borderColor: '#bfdbfe' },
  '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
};

/* ── Shimmer ── */
const TrainerTasksShimmer = ({ rows = 6 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box display="flex" alignItems="center" gap={2}>
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
          <Box>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={120} height={18} />
          </Box>
        </Box>
      </Box>
      <Paper sx={{ ...card, p: 2.5, mb: 2.5 }}>
        <Skeleton variant="rounded" width={340} height={40} sx={{ borderRadius: '10px' }} />
      </Paper>
      <Paper sx={{ ...card, p: 2, mb: 2.5, textAlign: 'center' }}>
        <Skeleton variant="text" width={50} height={36} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width={80} height={18} sx={{ mx: 'auto' }} />
      </Paper>
      <Paper sx={{ ...card, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: '#f8fafc' }}>
              {[70, 120, 60, 180, 80, 80, 80].map((w, i) => <TableCell key={i}><Skeleton variant="text" width={w} /></TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map(i => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                <TableCell><Skeleton variant="text" width={160} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell><Box display="flex" gap={1} justifyContent="center">{[0, 1].map(j => <Skeleton key={j} variant="circular" width={32} height={32} />)}</Box></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MentorTrainerTasksList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [batchCodes, setBatchCodes] = useState([]);
  const [filterBatchCode, setFilterBatchCode] = useState('');
  const [filterSessionId, setFilterSessionId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [editDialog, setEditDialog] = useState({ open: false, task: null });
  const [editForm, setEditForm] = useState({ Task_Content: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Backend returns: { Task_ID, Batch_Code, Session_ID, Task_Content, Start_DateTime, End_DateTime }
  const formatTaskData = (task) => ({
    Task_ID: task.Task_ID || task.ID || task.id,
    Batch_Code: task.Batch_Code || task.batch_code || '',
    Batch_ID: task.Batch_ID || task.batch_id || '',
    Session_ID: task.Session_ID || task.session_id,
    Task_Content: task.Task_Content || task.Task_Box || task.task_box || '',
    Start_DateTime: task.Start_DateTime || '',
    End_DateTime: task.End_DateTime || '',
    Trainer_ID: task.Trainer_ID || ''
  });

  // Fetch batch codes for dropdown
  const fetchBatchCodes = async () => {
    try {
      if (!user?.id) return;
      const response = await trainerTasksAPI.getMentorBatchCodes(user.id);
      if (Array.isArray(response)) {
        setBatchCodes(response);
      }
    } catch (error) {
      console.error('Error fetching batch codes:', error);
    }
  };

  // Fetch tasks using correct mentor API with filters
  const fetchTasks = async () => {
    try {
      setError(null);

      if (!user?.id) {
        setError('Mentor ID not found. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const filters = {};
      if (filterBatchCode) filters.batch_code = filterBatchCode;
      if (filterSessionId) filters.session_id = filterSessionId;
      if (filterStartDate) filters.start_date = filterStartDate;
      if (filterEndDate) filters.end_date = filterEndDate;

      // GET /api/org/mentor/trainer-task/lists?mentor_id=<id>&...filters
      const response = await trainerTasksAPI.getMentorTasks(user.id, filters);

      console.log('Mentor Tasks API Response:', response);

      let tasksData = [];
      if (Array.isArray(response)) {
        tasksData = response;
      } else if (response?.tasks) {
        tasksData = Array.isArray(response.tasks) ? response.tasks : [response.tasks];
      } else if (response?.data) {
        tasksData = Array.isArray(response.data) ? response.data : [response.data];
      }

      setTasks(tasksData.map(formatTaskData));
    } catch (error) {
      console.error('Error fetching mentor tasks:', error);
      setError(error.message || 'Failed to fetch tasks. Please try again.');
      setSnackbar({ open: true, message: error.message || 'Failed to fetch tasks', severity: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBatchCodes(); }, []);
  useEffect(() => { fetchTasks(); }, [filterBatchCode, filterSessionId, filterStartDate, filterEndDate]);

  const handleRefresh = async () => { setRefreshing(true); await fetchTasks(); };
  const handleSearch = (event) => { setSearchTerm(event.target.value); };

  // Filter handlers
  const handleFilterBatchCode = (event) => { setFilterBatchCode(event.target.value); setLoading(true); };
  const handleFilterSessionId = (event) => { setFilterSessionId(event.target.value); };
  const handleFilterStartDate = (event) => { setFilterStartDate(event.target.value); setLoading(true); };
  const handleFilterEndDate = (event) => { setFilterEndDate(event.target.value); setLoading(true); };
  const handleClearFilters = () => {
    setFilterBatchCode(''); setFilterSessionId(''); setFilterStartDate(''); setFilterEndDate(''); setSearchTerm(''); setLoading(true);
  };

  const handleView = (taskId) => {
    if (!taskId || taskId === 'undefined' || taskId === 'null') return;
    navigate(`/mentor/tasks/view/${taskId}`);
  };

  // Edit — only Task_Content (Task_Box) is editable
  const handleEdit = (task) => {
    setEditForm({ Task_Content: task.Task_Content || '' });
    setEditDialog({ open: true, task });
  };
  const handleEditClose = () => { setEditDialog({ open: false, task: null }); setEditForm({ Task_Content: '' }); };
  const handleEditFormChange = (field) => (event) => { setEditForm(prev => ({ ...prev, [field]: event.target.value })); };

  // Calls dedicated mentor update endpoint: PUT /api/org/mentor/trainer-task/update/<id>
  const handleEditSubmit = async () => {
    try {
      setEditLoading(true);
      const taskId = editDialog.task?.Task_ID;
      const taskContent = editForm.Task_Content;

      console.log('Sending update as mentor:', { taskId, taskContent, mentorId: user.id });

      // Uses updateTaskAsMentor → PUT /api/org/mentor/trainer-task/update/<id> with { Mentor_ID }
      await trainerTasksAPI.updateTaskAsMentor(taskId, taskContent, user.id);

      // Update local state
      const updatedTasks = tasks.map(task =>
        task.Task_ID === taskId ? { ...task, Task_Content: taskContent } : task
      );
      setTasks(updatedTasks);
      handleEditClose();
      setSnackbar({ open: true, message: 'Task updated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error updating task:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to update task', severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseSnackbar = () => { setSnackbar({ ...snackbar, open: false }); };

  // Client-side search
  const filteredTasks = tasks.filter(task => {
    const taskContent = (task.Task_Content || '').toLowerCase();
    const batchCode = (task.Batch_Code || '').toLowerCase();
    const s = searchTerm.toLowerCase();
    return (
      taskContent.includes(s) ||
      batchCode.includes(s) ||
      (task.Task_ID || '').toString().includes(s) ||
      (task.Session_ID || '').toString().includes(s)
    );
  });

  const hasActiveFilters = filterBatchCode || filterSessionId || filterStartDate || filterEndDate;

  if (loading) return <TrainerTasksShimmer rows={8} />;

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, animation: 'ttFadeUp 0.5s ease-out both' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
          }}>
            <Assignment sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2 }}>
              Trainer Tasks
            </Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh tasks" arrow>
          <IconButton onClick={handleRefresh} disabled={refreshing} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease',
          }}>
            <Refresh sx={{ fontSize: 20, color: '#475569', animation: refreshing ? 'ttSpin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}
          onClose={() => setError(null)}
          action={<Button color="inherit" size="small" onClick={handleRefresh} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none' }}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper elevation={0} sx={{ ...card, p: 2.5, mb: 2.5, animation: 'ttFadeUp 0.5s ease-out 0.1s both' }}>
        <TextField
          placeholder="Search tasks by ID, Batch Code, Session ID, or content..."
          variant="outlined" size="small" value={searchTerm} onChange={handleSearch}
          sx={{ ...inputSx, width: '100%', maxWidth: 500 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>,
          }}
        />
      </Paper>

      {/* Filter Dropdowns */}
      <Paper elevation={0} sx={{ ...card, p: 2.5, mb: 2.5, animation: 'ttFadeUp 0.5s ease-out 0.12s both' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList sx={{ fontSize: 20, color: '#0ea5e9' }} />
          <Typography sx={{ ...hFont, fontSize: '0.9rem', color: '#1e3a8a' }}>Filters</Typography>
          {hasActiveFilters && (
            <Button size="small" onClick={handleClearFilters} sx={{
              ml: 'auto', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
              textTransform: 'none', fontSize: '0.78rem', color: '#ef4444',
              '&:hover': { background: '#fef2f2' },
            }}>Clear All</Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Batch Code Dropdown */}
          <FormControl size="small" sx={{ minWidth: 220, flex: '1 1 220px', maxWidth: 300 }}>
            <InputLabel sx={{ fontFamily: '"DM Sans", sans-serif', color: '#64748b' }}>Batch Code</InputLabel>
            <Select value={filterBatchCode} onChange={handleFilterBatchCode} label="Batch Code" sx={selectSx}>
              <MenuItem value=""><em>All Batches</em></MenuItem>
              {batchCodes.map((batch) => (
                <MenuItem key={batch.Batch_ID} value={batch.Batch_Code} sx={{ fontFamily: '"DM Sans", sans-serif' }}>
                  {batch.Batch_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Session ID */}
          <TextField
            size="small" label="Session ID" placeholder="Filter by Session ID"
            value={filterSessionId} onChange={handleFilterSessionId} type="number"
            sx={{ ...inputSx, minWidth: 160, flex: '1 1 160px', maxWidth: 220 }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setLoading(true); fetchTasks(); } }}
            InputProps={{
              endAdornment: filterSessionId ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setFilterSessionId(''); setLoading(true); }}>
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          {/* Start Date */}
          <TextField size="small" label="Start Date" type="date"
            value={filterStartDate} onChange={handleFilterStartDate}
            sx={{ ...inputSx, minWidth: 170, flex: '1 1 170px', maxWidth: 220 }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: '#94a3b8', fontSize: 16 }} /></InputAdornment> }}
          />

          {/* End Date */}
          <TextField size="small" label="End Date" type="date"
            value={filterEndDate} onChange={handleFilterEndDate}
            sx={{ ...inputSx, minWidth: 170, flex: '1 1 170px', maxWidth: 220 }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: '#94a3b8', fontSize: 16 }} /></InputAdornment> }}
          />
        </Box>
      </Paper>

      {/* Summary Stat */}
      <Paper elevation={0} sx={{ ...card, p: 2.5, mb: 2.5, textAlign: 'center', animation: 'ttFadeUp 0.5s ease-out 0.15s both' }}>
        <Typography sx={{ ...hFont, fontSize: '1.6rem', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
          {tasks.length}
        </Typography>
        <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.3 }}>Total Tasks</Typography>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ ...card, overflow: 'hidden', animation: 'ttFadeUp 0.5s ease-out 0.2s both' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Task ID', 'Batch Code', 'Session ID', 'Task Content', 'Start Date', 'End Date', 'Actions'].map(h => (
                  <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.5, whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ borderBottom: 'none', py: 5 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{
                        width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 1.5,
                        background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(13,148,136,0.04))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Assignment sx={{ color: '#0ea5e9', fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ ...hFont, fontSize: '1rem', mb: 0.5 }}>No Tasks Found</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>
                        {tasks.length === 0 ? 'No tasks available for your batches yet.' : 'No tasks match your search criteria.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.Task_ID} sx={{
                    transition: 'background 0.2s ease',
                    '&:hover': { background: '#f8fafc' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}>
                    {/* Task ID */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                      <Chip label={`#${task.Task_ID}`} size="small" sx={{
                        height: 26, fontSize: '0.76rem', fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontWeight: 600, background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
                      }} />
                    </TableCell>

                    {/* Batch Code */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Group sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography sx={{ ...bFont, fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                          {task.Batch_Code || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Session ID */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                      <Typography sx={{ ...bFont, fontSize: '0.84rem', fontWeight: 500, color: '#0f172a' }}>{task.Session_ID}</Typography>
                    </TableCell>

                    {/* Task Content */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6, maxWidth: 300 }}>
                      <Typography sx={{
                        ...bFont, fontSize: '0.84rem', color: '#475569',
                        wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {task.Task_Content || 'No content'}
                      </Typography>
                    </TableCell>

                    {/* Start Date */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6, whiteSpace: 'nowrap' }}>
                      <Typography sx={{ ...bFont, fontSize: '0.8rem', color: '#475569' }}>
                        {task.Start_DateTime
                          ? new Date(task.Start_DateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </Typography>
                      {task.Start_DateTime && (
                        <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', mt: 0.2 }}>
                          {new Date(task.Start_DateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </TableCell>

                    {/* End Date */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6, whiteSpace: 'nowrap' }}>
                      <Typography sx={{ ...bFont, fontSize: '0.8rem', color: '#475569' }}>
                        {task.End_DateTime
                          ? new Date(task.End_DateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </Typography>
                      {task.End_DateTime && (
                        <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', mt: 0.2 }}>
                          {new Date(task.End_DateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                      <Box display="flex" gap={0.5} justifyContent="center">
                        {[
                          { icon: <Visibility sx={{ fontSize: 17 }} />, title: 'View Task', color: '#0ea5e9', onClick: () => handleView(task.Task_ID) },
                          { icon: <Edit sx={{ fontSize: 17 }} />, title: 'Edit Task', color: '#1e3a8a', onClick: () => handleEdit(task) },
                        ].map((a, i) => (
                          <Tooltip key={i} title={a.title} arrow>
                            <IconButton size="small" onClick={a.onClick} sx={{
                              width: 32, height: 32, borderRadius: '8px', color: a.color,
                              background: `${a.color}0A`, border: `1px solid ${a.color}15`,
                              transition: 'all 0.25s ease',
                              '&:hover': { background: `${a.color}12`, borderColor: `${a.color}30`, transform: 'translateY(-1px)' },
                            }}>
                              {a.icon}
                            </IconButton>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog — only Task Content is editable */}
      <Dialog open={editDialog.open} onClose={handleEditClose} TransitionComponent={Transition} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 24px 48px rgba(30,58,138,0.12)', border: '1px solid #e8ecf2' } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: 'white', py: 2.5, borderRadius: '16px 16px 0 0' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Assignment sx={{ fontSize: 24 }} />
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
                Edit Task (ID: {editDialog.task?.Task_ID})
              </Typography>
            </Box>
            <IconButton onClick={handleEditClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }} disabled={editLoading}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3.5, background: '#f8fafc' }}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px', border: '1px solid #e8ecf2' }}>
              <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>Task ID:</strong> {editDialog.task?.Task_ID} &nbsp;|&nbsp;
                <strong style={{ color: '#0f172a' }}>Batch:</strong> {editDialog.task?.Batch_Code || 'N/A'} &nbsp;|&nbsp;
                <strong style={{ color: '#0f172a' }}>Session:</strong> {editDialog.task?.Session_ID}
              </Typography>
            </Box>
            <TextField fullWidth label="Task Content" value={editForm.Task_Content}
              onChange={handleEditFormChange('Task_Content')} variant="outlined" multiline rows={6}
              disabled={editLoading} helperText="Edit the task questions or content (Batch and Session cannot be changed)"
              placeholder="What is python?, what are array?" sx={inputSx} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: '#f8fafc' }}>
          <Button onClick={handleEditClose} disabled={editLoading} startIcon={<Cancel />} sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none',
            borderRadius: '10px', color: '#64748b', border: '1.5px solid #e8ecf2', px: 3,
            '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' },
          }}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" disableElevation
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={18} color="inherit" /> : <Save />}
            sx={{ ...accent, px: 3 }}>
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MentorTrainerTasksList;