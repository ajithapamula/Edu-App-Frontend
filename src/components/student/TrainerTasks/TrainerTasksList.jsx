import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import React, { useState, useEffect } from 'react';
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
  TextField,
  Alert,
  Tooltip,
  Skeleton,
  Snackbar,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Visibility,
  Search,
  Assignment,
  Group,
  Refresh,
  SearchOutlined,
  FilterList,
  CalendarToday,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { trainerTasksAPI } from '../../../services/API/trainertasks';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* ——— Shimmer ——— */
const TrainerTasksShimmer = ({ rows = 6 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={220} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ p: 2, mb: 3, borderRadius: '14px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
        <Skeleton variant="rectangular" width={350} height={40} sx={{ borderRadius: '10px' }} />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: '14px' }} />
      </Box>
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
        <Table>
          <TableHead>
            <TableRow>
              {[70, 120, 60, 180, 80, 80, 50].map((w, i) => (
                <TableCell key={i}><Skeleton variant="text" width={w} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                <TableCell><Skeleton variant="text" width={160} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell align="center"><Skeleton variant="circular" width={34} height={34} sx={{ mx: 'auto' }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack, bgcolor: '#f8fafc',
    '& fieldset': { borderColor: 'rgba(41,128,185,0.12)' },
    '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
    '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { fontFamily: fontStack, color: '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#2980b9' },
};

const selectSx = {
  borderRadius: '10px', fontFamily: fontStack, fontSize: '0.85rem', bgcolor: '#f8fafc',
  '& fieldset': { borderColor: 'rgba(41,128,185,0.12)' },
  '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
  '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
};

const StudentTrainerTasksList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [filterBatchCode, setFilterBatchCode] = useState('');
  const [filterSessionId, setFilterSessionId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Backend getStudentTasks returns:
  // { Task_ID, Batch_Code, Session_ID, Task_Content, Start_DateTime, End_DateTime }
  const formatTaskData = (task) => ({
    Task_ID: task.Task_ID || task.ID || task.id,
    Batch_Code: task.Batch_Code || task.batch_code || '',
    Session_ID: task.Session_ID || task.session_id,
    Task_Content: task.Task_Content || task.Task_Box || task.task_box || '',
    Start_DateTime: task.Start_DateTime || '',
    End_DateTime: task.End_DateTime || '',
  });

  const fetchTasks = async () => {
    try {
      setError(null);
      const studentId = user?.id || user?.ID || user?.student_id;

      if (!studentId) {
        setError('Student ID not found. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Build filters
      const filters = {};
      if (filterBatchCode) filters.batch_code = filterBatchCode;
      if (filterSessionId) filters.session_id = filterSessionId;
      if (filterStartDate) filters.start_date = filterStartDate;
      if (filterEndDate) filters.end_date = filterEndDate;

      // GET /api/org/student/trainer-task/lists?student_id=<id>&...filters
      const response = await trainerTasksAPI.getStudentTasks(studentId, filters);

      console.log('Student Tasks API Response:', response);

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
      console.error('Error fetching student tasks:', error);
      setError(error.message || 'Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [filterBatchCode, filterSessionId, filterStartDate, filterEndDate]);

  const handleRefresh = async () => { setRefreshing(true); await fetchTasks(); };
  const handleSearch = (event) => setSearchTerm(event.target.value);

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
    navigate(`/student/tasks/view/${taskId}`);
  };

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

  // Get unique batch codes from loaded tasks for the dropdown
  const uniqueBatchCodes = [...new Set(tasks.map(t => t.Batch_Code).filter(Boolean))];

  const hasActiveFilters = filterBatchCode || filterSessionId || filterStartDate || filterEndDate;

  if (loading) return <TrainerTasksShimmer rows={8} />;

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)' }}
          onClose={() => setError(null)}
          action={<Button color="inherit" size="small" onClick={handleRefresh} sx={{ fontWeight: 600, textTransform: 'none' }}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 38, height: 38, borderRadius: '11px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Assignment sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Trainer Tasks
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh tasks"
          sx={{
            width: 38, height: 38, borderRadius: '10px',
            color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
            '&:hover': { bgcolor: 'rgba(41,128,185,0.12)' },
          }}
        >
          <Refresh sx={{
            fontSize: 20,
            animation: refreshing ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
          }} />
        </IconButton>
      </Box>

      {/* Search */}
      <Box sx={{ p: 2, mb: 3, borderRadius: '14px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)', boxShadow: '0 1px 3px rgba(26,82,118,0.04)' }}>
        <TextField
          placeholder="Search tasks by ID, Batch Code, Session ID, or content..."
          value={searchTerm}
          onChange={handleSearch}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 20, color: '#94a3b8' }} /></InputAdornment>,
          }}
          sx={{
            width: '100%', maxWidth: 500,
            ...inputSx,
          }}
        />
      </Box>

      {/* Filters */}
      <Box sx={{
        p: 2.5, mb: 3, borderRadius: '14px', bgcolor: '#fff',
        border: '1px solid rgba(41,128,185,0.08)',
        boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList sx={{ fontSize: 20, color: '#2980b9' }} />
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a5276', fontFamily: fontStack }}>Filters</Typography>
          {hasActiveFilters && (
            <Button size="small" onClick={handleClearFilters} sx={{
              ml: 'auto', fontFamily: fontStack, fontWeight: 600,
              textTransform: 'none', fontSize: '0.78rem', color: '#ef4444',
              '&:hover': { background: '#fef2f2' },
            }}>Clear All</Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Batch Code Dropdown */}
          <FormControl size="small" sx={{ minWidth: 220, flex: '1 1 220px', maxWidth: 300 }}>
            <InputLabel sx={{ fontFamily: fontStack, color: '#64748b' }}>Batch Code</InputLabel>
            <Select value={filterBatchCode} onChange={handleFilterBatchCode} label="Batch Code" sx={selectSx}>
              <MenuItem value=""><em>All Batches</em></MenuItem>
              {uniqueBatchCodes.map((code) => (
                <MenuItem key={code} value={code} sx={{ fontFamily: fontStack }}>{code}</MenuItem>
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
      </Box>

      {/* Summary Card */}
      <Box sx={{
        p: 2.5, mb: 3, borderRadius: '14px', bgcolor: '#fff',
        border: '1px solid rgba(41,128,185,0.08)',
        boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Assignment sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontFamily: fontStack }}>{tasks.length}</Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>Total Tasks</Typography>
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{
        borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff',
        border: '1px solid rgba(41,128,185,0.08)',
        boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(41,128,185,0.04)' }}>
                {['Task ID', 'Batch Code', 'Session ID', 'Task Content', 'Start Date', 'End Date', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack, whiteSpace: 'nowrap' }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4 }}>
                      <Assignment sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                      <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
                        {tasks.length === 0 ? 'No tasks found.' : 'No tasks match your search criteria.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow
                    key={task.Task_ID}
                    hover
                    sx={{
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' },
                      '&:last-child td': { borderBottom: 0 },
                      borderBottom: '1px solid rgba(41,128,185,0.06)',
                    }}
                  >
                    {/* Task ID */}
                    <TableCell>
                      <Chip
                        label={`#${task.Task_ID}`}
                        size="small"
                        sx={{
                          height: 24, fontSize: '0.72rem', fontWeight: 700,
                          bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276',
                          borderRadius: '6px', fontFamily: fontStack,
                        }}
                      />
                    </TableCell>

                    {/* Batch Code */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.8}>
                        <Group sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontFamily: fontStack, fontWeight: 500 }}>
                          {task.Batch_Code || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Session ID */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontFamily: fontStack, fontWeight: 500 }}>
                        {task.Session_ID}
                      </Typography>
                    </TableCell>

                    {/* Task Content */}
                    <TableCell>
                      <Typography sx={{
                        fontSize: '0.85rem', fontWeight: 500, color: '#0f172a', fontFamily: fontStack,
                        wordBreak: 'break-word', maxWidth: 300, overflow: 'hidden',
                        textOverflow: 'ellipsis', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {task.Task_Content || 'No content'}
                      </Typography>
                    </TableCell>

                    {/* Start Date */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontFamily: fontStack }}>
                        {task.Start_DateTime
                          ? new Date(task.Start_DateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </Typography>
                      {task.Start_DateTime && (
                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack, mt: 0.2 }}>
                          {new Date(task.Start_DateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </TableCell>

                    {/* End Date */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontFamily: fontStack }}>
                        {task.End_DateTime
                          ? new Date(task.End_DateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </Typography>
                      {task.End_DateTime && (
                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack, mt: 0.2 }}>
                          {new Date(task.End_DateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions — View only */}
                    <TableCell align="center">
                      <Tooltip title="View Task" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleView(task.Task_ID)}
                          sx={{
                            width: 34, height: 34, borderRadius: '9px',
                            color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' },
                          }}
                        >
                          <Visibility sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default StudentTrainerTasksList;