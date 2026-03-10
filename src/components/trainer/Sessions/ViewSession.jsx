import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduledIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

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
  },
  time12: (date) => {
    if (!date) return 'Not set';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid time';
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) { return 'Time error'; }
  }
};

const ViewSession = () => {
  const { id, batchId } = useParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ═══════════════════════════════════════════════════════════════
  // NEW: Batch-context-aware base path for navigation
  // ═══════════════════════════════════════════════════════════════
  const basePath = batchId ? `/trainer/batches/${batchId}/sessions` : '/trainer/sessions';

  // ═══════════════════════════════════════════════════════════════
  // FIX: Get trainer ID from AuthContext (user.id)
  // ═══════════════════════════════════════════════════════════════
  const { user } = useContext(AuthContext);
  const trainerId = user?.id;

  useEffect(() => {
    console.log('ViewSession - AuthContext user:', user);
    console.log('ViewSession - Trainer ID:', trainerId);
    console.log('ViewSession - Batch ID from URL:', batchId);
  }, [user, trainerId, batchId]);

  useEffect(() => {
    if (id && trainerId) fetchSessionDetails();
    else if (id && !trainerId) {
      setError('Trainer ID not found. Please log in again.');
      setLoading(false);
    }
  }, [id, trainerId]);

  const fetchSessionDetails = async () => {
    if (!trainerId) {
      setError('Trainer ID not found. Please log in again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      let session = null;
      try {
        session = await sessionsAPI.getById(id, trainerId);
      } catch (getByIdError) {
        console.log('getById failed, trying getAll approach:', getByIdError);
        const allSessions = await sessionsAPI.getAll(trainerId);
        session = allSessions.find(s => s.Session_ID === parseInt(id) || s.id === parseInt(id));
      }
      if (session) {
        console.log('Session found:', session);
        setSessionData(session);
      } else {
        setError('Session not found');
      }
    } catch (err) {
      setError('Failed to fetch session details');
      console.error('Error fetching session details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'cancelled': return 'error';
      case 'scheduled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircleIcon />;
      case 'active': return <PlayCircleOutlineIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'scheduled': return <ScheduledIcon />;
      default: return <ScheduleIcon />;
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

  const calculateDuration = (startTime, endTime) => {
    try {
      if (!startTime || !endTime) return 'N/A';
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
      const diffMs = end - start;
      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins} minutes`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    } catch (error) { return 'N/A'; }
  };

  if (loading) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card><CardContent>
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="text" width="60%" height={20} />
              <Box sx={{ mt: 3 }}><Skeleton variant="rectangular" width="100%" height={200} /></Box>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent><Skeleton variant="rectangular" width="100%" height={300} /></CardContent></Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !sessionData) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(basePath)} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
          <Typography variant="h5">Session Details</Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">{error || 'Session not found'}</Typography>
          <Typography variant="body2">
            {error?.includes('Trainer ID')
              ? 'Your session has expired. Please log in again.'
              : "The session you're looking for doesn't exist or couldn't be loaded."}
          </Typography>
        </Alert>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate(basePath)} startIcon={<ArrowBackIcon />}>Go Back</Button>
          {error?.includes('Trainer ID') ? (
            <Button variant="contained" onClick={() => navigate('/login')}>Login</Button>
          ) : (
            <Button variant="contained" onClick={fetchSessionDetails} startIcon={<RefreshIcon />}>Retry</Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" onClick={() => navigate(basePath)} sx={{ cursor: 'pointer' }}>Sessions</Link>
        <Typography color="text.primary">Session {sessionData.Session_ID}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(basePath)} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
          <ScheduleIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Session Details</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Session ID: {sessionData.Session_ID} • Batch: {sessionData.Batch_Code || sessionData.Batch_ID}
            </Typography>
          </Box>
        </Box>
        <Chip icon={getStatusIcon(sessionData.Status)} label={sessionData.Status || 'Unknown'}
          color={getStatusColor(sessionData.Status)} size="large" sx={{ fontWeight: 'bold' }} />
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Session Overview */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}><SchoolIcon /></Avatar>}
              title={<Typography variant="h5" fontWeight="bold">Session Information</Typography>}
              subheader={`Batch Code: ${sessionData.Batch_Code || 'N/A'} • Session ID: ${sessionData.Session_ID}`}
            />
            <CardContent>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" mb={3}>
                    <BusinessIcon sx={{ mr: 2, mt: 0.5, color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Batch Information</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {sessionData.Batch_Code || `Batch ${sessionData.Batch_ID}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Batch ID: {sessionData.Batch_ID}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" mb={3}>
                    <AssessmentIcon sx={{ mr: 2, mt: 0.5, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Session Status</Typography>
                      <Chip icon={getStatusIcon(sessionData.Status)} label={sessionData.Status || 'Unknown'}
                        color={getStatusColor(sessionData.Status)} size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" mb={3}>
                    <AccessTimeIcon sx={{ mr: 2, mt: 0.5, color: 'success.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Session Timing</Typography>
                      <Typography variant="body1" fontWeight="medium">Start: {formatDate(sessionData.Start_DateTime)}</Typography>
                      <Typography variant="body1" fontWeight="medium">End: {formatDate(sessionData.End_DateTime)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {calculateDuration(sessionData.Start_DateTime, sessionData.End_DateTime)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" mb={3}>
                    <LinkIcon sx={{ mr: 2, mt: 0.5, color: 'info.main' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Session Access</Typography>
                      {sessionData.Session_Link ? (
                        <Button variant="outlined" startIcon={<PlayCircleOutlineIcon />}
                          onClick={() => window.open(sessionData.Session_Link, '_blank')} sx={{ mt: 1 }}>
                          Open Session Link
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No session link available</Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Summary Panel */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardHeader
              title={<Typography variant="h6" fontWeight="bold">Session Summary</Typography>}
              avatar={<Avatar sx={{ bgcolor: 'success.main' }}><AssessmentIcon /></Avatar>}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="info.main" fontWeight="bold">{sessionData.Session_ID}</Typography>
                    <Typography variant="caption" color="text.secondary">Session ID</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="secondary.main" fontWeight="bold">{sessionData.Batch_ID}</Typography>
                    <Typography variant="caption" color="text.secondary">Batch ID</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <AccessTimeIcon sx={{ fontSize: 36, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {calculateDuration(sessionData.Start_DateTime, sessionData.End_DateTime)}
                    </Typography>
                    <Typography variant="body2">Duration</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {sessionData.Batch_Code || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Batch Code</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }} elevation={2}>
            <CardHeader title={<Typography variant="h6" fontWeight="bold">Quick Actions</Typography>} />
            <CardContent>
              <List dense>
                <ListItem button onClick={() => navigate(`${basePath}/edit/${sessionData.Session_ID}`)}>
                  <ListItemIcon><ScheduleIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Edit Session" secondary="Modify session details" />
                </ListItem>
                <Divider />
                <ListItem button onClick={() => navigate(basePath)}>
                  <ListItemIcon><GroupIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="View All Sessions" secondary="Go back to session list" />
                </ListItem>
                <Divider />
                <ListItem button onClick={fetchSessionDetails}>
                  <ListItemIcon><RefreshIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Refresh Data" secondary="Reload session information" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Complete Session Record Table */}
      <Card sx={{ mt: 3 }} elevation={3}>
        <CardHeader
          title={<Typography variant="h6" fontWeight="bold">Complete Session Record</Typography>}
          subheader="All available session information"
        />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Field</strong></TableCell>
                  <TableCell><strong>Value</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>Session ID</TableCell><TableCell>{sessionData.Session_ID || 'N/A'}</TableCell></TableRow>
                <TableRow><TableCell>Batch Code</TableCell><TableCell>{sessionData.Batch_Code || 'N/A'}</TableCell></TableRow>
                <TableRow><TableCell>Batch ID</TableCell><TableCell>{sessionData.Batch_ID || 'N/A'}</TableCell></TableRow>
                <TableRow>
                  <TableCell>Session Link</TableCell>
                  <TableCell>
                    {sessionData.Session_Link ? (
                      <Button size="small" variant="outlined" startIcon={<LinkIcon />}
                        onClick={() => window.open(sessionData.Session_Link, '_blank')}>
                        Open Link
                      </Button>
                    ) : 'No link available'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>
                    <Chip icon={getStatusIcon(sessionData.Status)} label={sessionData.Status || 'Unknown'}
                      color={getStatusColor(sessionData.Status)} size="small" />
                  </TableCell>
                </TableRow>
                <TableRow><TableCell>Start Date & Time</TableCell><TableCell>{formatDate(sessionData.Start_DateTime)}</TableCell></TableRow>
                <TableRow><TableCell>End Date & Time</TableCell><TableCell>{formatDate(sessionData.End_DateTime)}</TableCell></TableRow>
                <TableRow><TableCell>Duration</TableCell><TableCell>{calculateDuration(sessionData.Start_DateTime, sessionData.End_DateTime)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ViewSession;