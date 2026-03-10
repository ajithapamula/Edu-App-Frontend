import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Skeleton,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  IconButton,
  Divider
} from '@mui/material';
import {
  Visibility,
  Edit,
  Add,
  Refresh,
  Delete,
  ChevronRight,
  Person,
  CalendarMonth,
  Settings,
  Share,
  Download,
  OpenInNew,
  FiberManualRecord,
  Assignment as AssignmentIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

import { sessionsAPI } from '../../../services/API/sessions';
import { AuthContext } from '../../../context/AuthContext';

// Fallback date formatters
const fallbackDateFormatters = {
  medium: (date) => {
    if (!date) return 'Not set';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) { return 'Date error'; }
  },
  dateTime: (date) => {
    if (!date) return 'Not set';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) { return 'DateTime error'; }
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('ErrorBoundary caught an error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <Box p={3}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Something went wrong</Typography>
            <Typography variant="body2">{this.state.error?.message || 'An unexpected error occurred'}</Typography>
          </Alert>
          <Button variant="contained" onClick={() => this.setState({ hasError: false, error: null })}>Try Again</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Shimmer Component
const ShimmerSessionCard = () => (
  <Box sx={{ p: 2, borderLeft: '4px solid', borderColor: 'grey.200', mb: 0.5 }}>
    <Skeleton variant="text" width="45%" height={18} sx={{ mb: 0.5 }} />
    <Skeleton variant="text" width="80%" height={22} />
  </Box>
);

const SessionsList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, session: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Task creation state
  const [taskBox, setTaskBox] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);
  const [sessionTasks, setSessionTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════
  // NEW: Get batchId from URL params for batch-context navigation
  // ═══════════════════════════════════════════════════════════════
  const { batchId } = useParams();
  const basePath = batchId ? `/trainer/batches/${batchId}/sessions` : '/trainer/sessions';

  // ═══════════════════════════════════════════════════════════════
  // FIX: Get trainer ID from AuthContext (user.id)
  // ═══════════════════════════════════════════════════════════════
  const { user } = useContext(AuthContext);
  const trainerId = user?.id;

  useEffect(() => {
    console.log('SessionsList - AuthContext user:', user);
    console.log('SessionsList - Trainer ID:', trainerId);
    console.log('SessionsList - Batch ID from URL:', batchId);
  }, [user, trainerId, batchId]);

  useEffect(() => { fetchSessions(); }, [trainerId]);

  // Auto-select first session when sessions load
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions]);

  // Fetch tasks when selected session changes
  useEffect(() => {
    if (selectedSession?.Session_ID) {
      fetchTasksForSession(selectedSession.Session_ID);
    } else {
      setSessionTasks([]);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    if (!trainerId) {
      setError('Trainer ID not found. Please log in again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await sessionsAPI.getAll(trainerId);
      console.log('Raw API Response:', response);
      setSessions(response);
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
      setSnackbar({ open: true, message: 'Failed to fetch sessions: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForSession = async (sessionId) => {
    if (!trainerId) {
      console.warn('Cannot fetch tasks: Trainer ID not found.');
      return;
    }
    try {
      setTasksLoading(true);
      const tasks = await sessionsAPI.getTasksForSession(sessionId, trainerId);
      setSessionTasks(tasks);
    } catch (err) {
      console.error('Error fetching tasks for session:', err);
      setSessionTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskBox.trim()) {
      setSnackbar({ open: true, message: 'Task content cannot be empty', severity: 'error' });
      return;
    }
    if (!selectedSession?.Session_ID) {
      setSnackbar({ open: true, message: 'No session selected', severity: 'error' });
      return;
    }
    if (!trainerId) {
      setSnackbar({ open: true, message: 'Trainer ID not found. Please log in again.', severity: 'error' });
      return;
    }
    try {
      setTaskSaving(true);
      await sessionsAPI.createTaskFromSession(selectedSession.Session_ID, { Task_Box: taskBox }, trainerId);
      setSnackbar({ open: true, message: 'Task created successfully!', severity: 'success' });
      setTaskBox('');
      fetchTasksForSession(selectedSession.Session_ID);
    } catch (err) {
      console.error('Error creating task:', err);
      setSnackbar({ open: true, message: 'Failed to create task: ' + err.message, severity: 'error' });
    } finally {
      setTaskSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FIXED: Navigation uses basePath for batch-context awareness
  // ═══════════════════════════════════════════════════════════════
  const handleViewSession = (sessionId) => { navigate(`${basePath}/view/${sessionId}`); };
  const handleEditSession = (session) => { navigate(`${basePath}/edit/${session.Session_ID}`); };

  const handleDeleteClick = (session) => { setDeleteDialog({ open: true, session: session }); };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.session) return;
    if (!trainerId) {
      setSnackbar({ open: true, message: 'Trainer ID not found. Please log in again.', severity: 'error' });
      return;
    }
    try {
      setDeleteLoading(true);
      await sessionsAPI.remove(deleteDialog.session.Session_ID, trainerId);
      setSessions(prev => prev.filter(s => s.Session_ID !== deleteDialog.session.Session_ID));
      if (selectedSession?.Session_ID === deleteDialog.session.Session_ID) {
        setSelectedSession(null);
      }
      setSnackbar({ open: true, message: `Session "${deleteDialog.session.Session_ID}" deleted successfully`, severity: 'success' });
      setDeleteDialog({ open: false, session: null });
    } catch (err) {
      console.error('Error deleting session:', err);
      setSnackbar({ open: true, message: 'Failed to delete session: ' + err.message, severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => { setDeleteDialog({ open: false, session: null }); };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'cancelled': return 'error';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusDotColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#4caf50';
      case 'active': return '#2563eb';
      case 'cancelled': return '#ef5350';
      case 'in-progress': return '#ff9800';
      case 'scheduled': return '#7c4dff';
      default: return '#bdbdbd';
    }
  };

  const formatDate = (dateValue, formatter = 'dateTime') => {
    try {
      if (!dateValue) return 'Not set';
      let date;
      if (typeof dateValue === 'string') { date = new Date(dateValue); }
      else if (dateValue instanceof Date) { date = dateValue; }
      else { return 'Invalid date'; }
      if (isNaN(date.getTime())) return 'Invalid date';
      return fallbackDateFormatters[formatter](date);
    } catch (error) { return 'Date error'; }
  };

  const handleCloseSnackbar = () => { setSnackbar({ ...snackbar, open: false }); };

  if (error && !loading) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchSessions} startIcon={<Refresh />}>Retry</Button>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2138', letterSpacing: '-0.5px' }}>
            Sessions
          </Typography>
          <Box display="flex" gap={1.5}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchSessions} disabled={loading}
              sx={{ borderColor: '#d0d5dd', color: '#475467', textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 2.5,
                '&:hover': { borderColor: '#98a2b3', bgcolor: '#f9fafb' } }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate(`${basePath}/create`)}
              sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 2.5,
                boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' } }}>
              Create Session
            </Button>
          </Box>
        </Box>

        {/* Main Content — Split Panel Layout */}
        <Box sx={{ display: 'flex', gap: 0, bgcolor: '#ffffff', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 24px rgba(0,0,0,0.06)', minHeight: '70vh' }}>

          {/* ======= LEFT PANEL — Session List ======= */}
          <Box sx={{ width: '38%', minWidth: 300, maxWidth: 460, borderRight: '1px solid #eef0f4',
            overflowY: 'auto', maxHeight: '75vh',
            '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#d0d5dd', borderRadius: 4 } }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <ShimmerSessionCard key={index} />)
            ) : sessions.length === 0 ? (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>No session records found</Typography>
                <Button variant="contained" size="small" startIcon={<Add />} onClick={() => navigate(`${basePath}/create`)}
                  sx={{ bgcolor: '#2563eb', textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: '#1d4ed8' } }}>
                  Create First Session
                </Button>
              </Box>
            ) : (
              sessions.map((session, index) => {
                const isSelected = selectedSession?.Session_ID === session.Session_ID;
                return (
                  <Box key={session.Session_ID || index}
                    onClick={() => setSelectedSession(session)}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2,
                      cursor: 'pointer', borderLeft: '4px solid',
                      borderLeftColor: isSelected ? '#2563eb' : 'transparent',
                      bgcolor: isSelected ? '#f0f5ff' : 'transparent',
                      transition: 'all 0.2s ease', borderBottom: '1px solid #f2f4f7',
                      '&:hover': { bgcolor: isSelected ? '#f0f5ff' : '#f9fafb' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption"
                        sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        SESSION {session.Session_ID}
                      </Typography>
                      <Typography variant="body1"
                        sx={{ fontWeight: 600, color: '#1a2138', mt: 0.3, fontSize: '0.93rem', lineHeight: 1.4,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {session.Batch_Code || `Batch ${session.Batch_ID}`} — {session.Status || 'No Status'}
                      </Typography>
                      {isSelected && (
                        <Typography variant="caption"
                          sx={{ color: '#98a2b3', fontStyle: 'italic', fontSize: '0.75rem', mt: 0.2, display: 'block' }}>
                          Currently viewing
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                      {!isSelected && <FiberManualRecord sx={{ fontSize: 10, color: getStatusDotColor(session.Status) }} />}
                      {isSelected && <ChevronRight sx={{ fontSize: 20, color: '#2563eb' }} />}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          {/* ======= RIGHT PANEL — Session Detail ======= */}
          <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '75vh' }}>
            {loading ? (
              <Box>
                <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" height={36} sx={{ mb: 3 }} />
                <Box display="flex" gap={6} mb={4}>
                  <Box><Skeleton variant="circular" width={44} height={44} /><Skeleton variant="text" width={100} sx={{ mt: 1 }} /></Box>
                  <Box><Skeleton variant="circular" width={44} height={44} /><Skeleton variant="text" width={140} sx={{ mt: 1 }} /></Box>
                </Box>
                <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2, mb: 2 }} />
              </Box>
            ) : !selectedSession ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#98a2b3' }}>
                <CalendarMonth sx={{ fontSize: 56, mb: 2, opacity: 0.4 }} />
                <Typography variant="h6" sx={{ fontWeight: 500, color: '#667085' }}>
                  {sessions.length === 0 ? 'No sessions yet' : 'Select a session to view details'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#98a2b3', mt: 0.5 }}>
                  {sessions.length === 0 ? 'Create your first session to get started' : 'Click on a session from the list'}
                </Typography>
              </Box>
            ) : (
              <>
                {/* Top Row: Batch_Code + Status chip */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                  <Typography variant="overline"
                    sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: '1px', fontSize: '0.75rem' }}>
                    {selectedSession.Batch_Code || `BATCH ${selectedSession.Batch_ID}`}
                  </Typography>
                  <Chip label={selectedSession.Status || 'Unknown'} color={getStatusColor(selectedSession.Status)}
                    variant="outlined" size="small" sx={{ fontWeight: 600, borderRadius: '8px', fontSize: '0.78rem', px: 0.5 }} />
                </Box>

                {/* Title + Action Icons */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2138', lineHeight: 1.3, fontSize: '1.5rem', pr: 2 }}>
                    Session {selectedSession.Session_ID}
                  </Typography>
                  <Box display="flex" gap={0.5} sx={{ mt: 0.5 }}>
                    <Box onClick={() => handleViewSession(selectedSession.Session_ID)}
                      sx={{ width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#667085', transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#f0f5ff', color: '#2563eb' } }} title="View Session">
                      <Visibility sx={{ fontSize: 20 }} />
                    </Box>
                    <Box onClick={() => handleEditSession(selectedSession)}
                      sx={{ width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#667085', transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#f0f5ff', color: '#2563eb' } }} title="Edit Session">
                      <Edit sx={{ fontSize: 20 }} />
                    </Box>
                    <Box onClick={() => handleDeleteClick(selectedSession)}
                      sx={{ width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#667085', transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#fef3f2', color: '#ef5350' } }} title="Delete Session">
                      <Delete sx={{ fontSize: 20 }} />
                    </Box>
                  </Box>
                </Box>

                {/* Info Row: Batch Code + Timing */}
                <Box sx={{ display: 'flex', gap: 4, py: 3, borderTop: '1px solid #f2f4f7', borderBottom: '1px solid #f2f4f7', mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Person sx={{ fontSize: 22, color: '#667085' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#98a2b3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                        BATCH CODE
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a2138', fontSize: '0.95rem' }}>
                        {selectedSession.Batch_Code || `Batch ${selectedSession.Batch_ID}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#f0f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarMonth sx={{ fontSize: 22, color: '#2563eb' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#98a2b3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                        TIMING
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a2138', fontSize: '0.95rem' }}>
                        {formatDate(selectedSession.Start_DateTime)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* End DateTime row */}
                {selectedSession.End_DateTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pb: 3, borderBottom: '1px solid #f2f4f7' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarMonth sx={{ fontSize: 22, color: '#667085' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#98a2b3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>END TIME</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a2138', fontSize: '0.95rem' }}>
                        {formatDate(selectedSession.End_DateTime)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Quick Configuration Row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Settings sx={{ fontSize: 22, color: '#98a2b3' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#475467', fontSize: '0.95rem' }}>Quick Configuration</Typography>
                  </Box>
                  <Typography onClick={() => handleEditSession(selectedSession)}
                    sx={{ color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.3px', '&:hover': { textDecoration: 'underline' } }}>
                    SETTINGS
                  </Typography>
                </Box>

                {/* Action Buttons Row */}
                <Box display="flex" gap={2} mb={3}>
                  <Button variant="outlined" startIcon={<Share />} fullWidth disabled={!selectedSession.Session_Link}
                    onClick={() => {
                      if (selectedSession.Session_Link) {
                        navigator.clipboard.writeText(selectedSession.Session_Link);
                        setSnackbar({ open: true, message: 'Session link copied to clipboard!', severity: 'success' });
                      }
                    }}
                    sx={{ borderColor: '#d0d5dd', color: '#475467', textTransform: 'none', fontWeight: 600, borderRadius: '12px', py: 1.3, fontSize: '0.9rem',
                      '&:hover': { borderColor: '#2563eb', color: '#2563eb', bgcolor: '#f0f5ff' } }}>
                    Share Link
                  </Button>
                  <Button variant="outlined" startIcon={<Download />} fullWidth
                    onClick={() => handleViewSession(selectedSession.Session_ID)}
                    sx={{ borderColor: '#d0d5dd', color: '#475467', textTransform: 'none', fontWeight: 600, borderRadius: '12px', py: 1.3, fontSize: '0.9rem',
                      '&:hover': { borderColor: '#2563eb', color: '#2563eb', bgcolor: '#f0f5ff' } }}>
                    Resources
                  </Button>
                </Box>

                {/* Launch Button */}
                <Button variant="contained" fullWidth startIcon={<OpenInNew />} disabled={!selectedSession.Session_Link}
                  onClick={() => { if (selectedSession.Session_Link) window.open(selectedSession.Session_Link, '_blank'); }}
                  sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700, borderRadius: '14px', py: 1.8, fontSize: '1rem',
                    letterSpacing: '0.3px', boxShadow: '0 2px 8px rgba(37,99,235,0.35)', mb: 3,
                    '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 16px rgba(37,99,235,0.45)' },
                    '&.Mui-disabled': { bgcolor: '#93b4f5', color: '#fff' } }}>
                  {selectedSession.Session_Link ? 'Launch Session Portal' : 'No Session Link Available'}
                </Button>

                {/* ═══════════════════════════════════════════════ */}
                {/* TRAINER TASK SECTION — Create + List Tasks     */}
                {/* ═══════════════════════════════════════════════ */}
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <AssignmentIcon sx={{ fontSize: 22, color: '#2563eb' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2138', fontSize: '1.05rem' }}>
                      Trainer Tasks
                    </Typography>
                    <Chip label={sessionTasks.length} size="small" color="primary" variant="outlined"
                      sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.8rem' }} />
                  </Box>

                  {/* Create Task Form */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter task content..."
                      value={taskBox}
                      onChange={(e) => setTaskBox(e.target.value)}
                      multiline
                      minRows={1}
                      maxRows={3}
                      disabled={taskSaving}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateTask();
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleCreateTask}
                      disabled={taskSaving || !taskBox.trim()}
                      sx={{
                        minWidth: 44,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: '#2563eb',
                        '&:hover': { bgcolor: '#1d4ed8' },
                        '&.Mui-disabled': { bgcolor: '#93b4f5' },
                      }}
                    >
                      {taskSaving ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
                    </Button>
                  </Box>

                  {/* Task List */}
                  {tasksLoading ? (
                    <Box>
                      <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1, mb: 1 }} />
                      <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                    </Box>
                  ) : sessionTasks.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#f9fafb', borderRadius: '10px', border: '1px dashed #d0d5dd' }}>
                      <AssignmentIcon sx={{ fontSize: 32, color: '#d0d5dd', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No tasks yet. Create your first task above.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {sessionTasks.map((task, idx) => (
                        <Box key={task.Task_ID || idx}
                          sx={{
                            display: 'flex', alignItems: 'flex-start', gap: 1.5,
                            p: 1.5, bgcolor: '#f9fafb', borderRadius: '10px',
                            border: '1px solid #eef0f4',
                            transition: 'all 0.15s',
                            '&:hover': { bgcolor: '#f0f5ff', borderColor: '#c7d7fe' }
                          }}>
                          <Box sx={{
                            width: 24, height: 24, borderRadius: '6px', bgcolor: '#e0e7ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, mt: 0.2
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb', fontSize: '0.7rem' }}>
                              {idx + 1}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ color: '#1a2138', fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                              {task.Task_Content || task.Task_Box || 'No content'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#98a2b3', fontSize: '0.7rem' }}>
                              Task #{task.Task_ID} • {task.Batch_Code || ''}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}
          PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700, color: '#1a2138' }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this session record?
              <br /><strong>Session ID:</strong> {deleteDialog.session?.Session_ID}
              <br /><strong>Batch:</strong> {deleteDialog.session?.Batch_Code || deleteDialog.session?.Batch_ID}
              <br /><br />This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleDeleteCancel} disabled={deleteLoading}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: '#475467' }}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={16} /> : <Delete />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 3 }}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
};

export default SessionsList;