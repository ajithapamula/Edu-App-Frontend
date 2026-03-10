import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  Breadcrumbs,
  Link,
  CircularProgress,
  Divider,
  Paper,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

import { sessionsAPI } from '../../../services/API/sessions';
import { AuthContext } from '../../../context/AuthContext';

const AddSession = () => {
  const navigate = useNavigate();
  const { id, batchId: urlBatchId } = useParams();
  const isEditMode = Boolean(id);

  // Determine if we came from a batch (batchId in URL)
  const hasUrlBatchId = Boolean(urlBatchId);

  // ═══════════════════════════════════════════════════════════════
  // NEW: Batch-context-aware base path for navigation
  // ═══════════════════════════════════════════════════════════════
  const basePath = hasUrlBatchId ? `/trainer/batches/${urlBatchId}/sessions` : '/trainer/sessions';

  const [formData, setFormData] = useState({
    Session_ID: '',
    Batch_Code: '',
    Batch_ID: urlBatchId || '',
    Session_Link: '',
    Status: '',
    Start_DateTime: '',
    End_DateTime: ''
  });

  // Batch codes dropdown data
  const [batchCodes, setBatchCodes] = useState([]);
  const [batchCodesLoading, setBatchCodesLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { user } = useContext(AuthContext);
  const trainerId = user?.id;

  useEffect(() => {
    console.log('AddSession - AuthContext user:', user);
    console.log('AddSession - Trainer ID:', trainerId);
    console.log('AddSession - URL Batch ID:', urlBatchId);
    if (!trainerId) {
      setError('Trainer ID not found. Please log in again.');
    }
  }, [user, trainerId, urlBatchId]);

  useEffect(() => {
    if (trainerId) {
      fetchBatchCodes();
      if (isEditMode && id) {
        fetchSessionForEdit();
      }
    }
  }, [id, isEditMode, trainerId]);

  // Auto-select batch when batchCodes load and we have urlBatchId
  useEffect(() => {
    if (hasUrlBatchId && batchCodes.length > 0 && !isEditMode) {
      const matchedBatch = batchCodes.find(b => String(b.Batch_ID) === String(urlBatchId));
      if (matchedBatch) {
        setFormData(prev => ({
          ...prev,
          Batch_Code: matchedBatch.Batch_Code,
          Batch_ID: matchedBatch.Batch_ID,
        }));
      }
    }
  }, [batchCodes, urlBatchId, hasUrlBatchId, isEditMode]);

  const fetchBatchCodes = async () => {
    if (!trainerId) {
      setSnackbar({ open: true, message: 'Trainer ID not found. Please log in again.', severity: 'error' });
      return;
    }
    try {
      setBatchCodesLoading(true);
      const batches = await sessionsAPI.getBatchCodes(trainerId);
      setBatchCodes(batches);
    } catch (err) {
      console.error('Error fetching batch codes:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load batch codes: ' + err.message,
        severity: 'error'
      });
    } finally {
      setBatchCodesLoading(false);
    }
  };

  const fetchSessionForEdit = async () => {
    if (!trainerId) {
      setError('Trainer ID not found. Please log in again.');
      return;
    }
    try {
      setLoading(true);
      let session = null;
      try {
        session = await sessionsAPI.getById(id, trainerId);
      } catch (getByIdError) {
        console.log('getById failed, trying getAll approach:', getByIdError);
        const allSessions = await sessionsAPI.getAll(trainerId);
        session = allSessions.find(s =>
          s.Session_ID === parseInt(id) || s.id === parseInt(id)
        );
      }

      if (session) {
        setFormData({
          Session_ID: session.Session_ID || '',
          Batch_Code: session.Batch_Code || '',
          Batch_ID: session.Batch_ID || '',
          Session_Link: session.Session_Link || '',
          Status: session.Status || '',
          Start_DateTime: session.Start_DateTime ? formatDateForInput(session.Start_DateTime) : '',
          End_DateTime: session.End_DateTime ? formatDateForInput(session.End_DateTime) : ''
        });
      } else {
        setError('Session not found');
      }
    } catch (err) {
      setError('Failed to fetch session details');
      console.error('Error fetching session for edit:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };

  const formatDateForAPI = (inputStr) => {
    try {
      if (!inputStr) return null;
      const date = new Date(inputStr);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return null;
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // When Batch_Code changes, also update Batch_ID
      if (field === 'Batch_Code') {
        const matched = batchCodes.find(b => b.Batch_Code === value);
        updated.Batch_ID = matched ? matched.Batch_ID : '';
      }

      return updated;
    });
  };

  const validateForm = () => {
    const errors = [];
    if (!trainerId) errors.push('Trainer ID not found. Please log in again.');
    if (!formData.Batch_Code && !formData.Batch_ID) errors.push('Batch is required');
    if (!formData.Start_DateTime) errors.push('Start Date Time is required');
    if (formData.Start_DateTime && formData.End_DateTime) {
      const startDate = new Date(formData.Start_DateTime);
      const endDate = new Date(formData.End_DateTime);
      if (endDate <= startDate) errors.push('End time must be after start time');
    }
    if (formData.Status && formData.Status.length > 50) errors.push('Status must be maximum 50 characters');
    return errors;
  };

  // ═══════════════════════════════════════════════════════════════
  // FIXED: Back path now goes to sessions list (not students)
  // ═══════════════════════════════════════════════════════════════
  const getBackPath = () => basePath;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSnackbar({ open: true, message: validationErrors.join(', '), severity: 'error' });
      return;
    }

    try {
      setSaving(true);

      const sessionData = {
        Batch_ID: formData.Batch_ID,
        Batch_Code: formData.Batch_Code,
        Start_DateTime: formatDateForAPI(formData.Start_DateTime),
        Trainer_ID: trainerId,
      };
      if (formData.End_DateTime) sessionData.End_DateTime = formatDateForAPI(formData.End_DateTime);
      if (formData.Session_Link && formData.Session_Link.trim()) sessionData.Session_Link = formData.Session_Link.trim();
      if (formData.Status && formData.Status.trim()) sessionData.Status = formData.Status.trim();

      console.log('Sending session data to API:', sessionData);

      let response;
      if (isEditMode) {
        response = await sessionsAPI.update(id, sessionData);
      } else {
        response = await sessionsAPI.create(sessionData);
      }

      setSnackbar({
        open: true,
        message: `Session ${isEditMode ? 'updated' : 'created'} successfully!`,
        severity: 'success'
      });

      // FIXED: Navigate back to sessions list (batch-context-aware)
      setTimeout(() => navigate(basePath), 1500);
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} session:`, err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditMode ? 'update' : 'create'} session: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (isEditMode) {
      fetchSessionForEdit();
    } else {
      setFormData({
        Session_ID: '',
        Batch_Code: hasUrlBatchId ? formData.Batch_Code : '',
        Batch_ID: hasUrlBatchId ? urlBatchId : '',
        Session_Link: '',
        Status: '',
        Start_DateTime: '',
        End_DateTime: ''
      });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" sx={{ bgcolor: 'background.default' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <CircularProgress size={48} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>Loading session data...</Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Box maxWidth="800px" mx="auto" px={3}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          {hasUrlBatchId ? (
            <>
              <Link color="inherit" onClick={() => navigate('/trainer/batches')} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Batches
              </Link>
              <Link color="inherit" onClick={() => navigate(basePath)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Sessions
              </Link>
            </>
          ) : (
            <Link color="inherit" onClick={() => navigate('/trainer/sessions')} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              Sessions
            </Link>
          )}
          <Typography color="text.primary" fontWeight="medium">
            {isEditMode ? 'Edit Session' : 'Create Session'}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate(getBackPath())} sx={{ mr: 2, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ bgcolor: isEditMode ? 'secondary.light' : 'primary.light', p: 1.5, borderRadius: 2, mr: 2 }}>
              {isEditMode ? <EditIcon sx={{ color: 'secondary.main' }} /> : <AddIcon sx={{ color: 'primary.main' }} />}
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {isEditMode ? 'Edit Session' : 'Create New Session'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isEditMode
                  ? `Editing Session ID: ${formData.Session_ID}`
                  : hasUrlBatchId
                    ? `Creating session for batch: ${formData.Batch_Code || `Batch ID ${urlBatchId}`}`
                    : 'Fill in the required details below to create a new training session'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}
            action={
              error.includes('Trainer ID') ? (
                <Button color="inherit" size="small" onClick={() => navigate('/login')}>Login</Button>
              ) : (
                <Button color="inherit" size="small" onClick={fetchSessionForEdit}>Retry</Button>
              )
            }>
            {error}
          </Alert>
        )}

        {/* Main Form */}
        <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 2, fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">Session Information</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {isEditMode ? 'Update the session details below' : 'Select Batch Code and Start Date/Time (required)'}
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>

                {isEditMode && (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Session Identification
                    </Typography>
                    <TextField fullWidth label="Session ID" value={formData.Session_ID} disabled variant="outlined"
                      helperText="Session ID cannot be changed"
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }} />
                  </Box>
                )}

                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Stack spacing={3}>
                    <FormControl fullWidth variant="outlined" required>
                      <InputLabel>Batch Code</InputLabel>
                      <Select
                        value={formData.Batch_Code}
                        onChange={handleInputChange('Batch_Code')}
                        label="Batch Code"
                        disabled={batchCodesLoading || (hasUrlBatchId && !isEditMode)}
                      >
                        {batchCodesLoading && (
                          <MenuItem value="" disabled>
                            <CircularProgress size={16} sx={{ mr: 1 }} /> Loading batch codes...
                          </MenuItem>
                        )}
                        {batchCodes.length === 0 && !batchCodesLoading && (
                          <MenuItem value="" disabled>No batches found</MenuItem>
                        )}
                        {batchCodes.map((batch) => (
                          <MenuItem key={batch.Batch_ID} value={batch.Batch_Code}>
                            {batch.Batch_Code}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField fullWidth label="Session Link" value={formData.Session_Link}
                      onChange={handleInputChange('Session_Link')} variant="outlined" type="url"
                      helperText="Enter the session meeting/conference link (optional)"
                      InputProps={{ startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Session Timing
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Stack spacing={3}>
                    <TextField fullWidth label="Start Date & Time" value={formData.Start_DateTime}
                      onChange={handleInputChange('Start_DateTime')} variant="outlined" type="datetime-local"
                      required InputLabelProps={{ shrink: true }} helperText="Select session start date and time" />
                    <TextField fullWidth label="End Date & Time" value={formData.End_DateTime}
                      onChange={handleInputChange('End_DateTime')} variant="outlined" type="datetime-local"
                      InputLabelProps={{ shrink: true }} helperText="Select session end date and time (optional)" />
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Session Status
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select value={formData.Status} onChange={handleInputChange('Status')} label="Status">
                      <MenuItem value=""><em>None</em></MenuItem>
                      <MenuItem value="Active">
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} /> Active
                        </Box>
                      </MenuItem>
                      <MenuItem value="Completed">
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mr: 1 }} /> Completed
                        </Box>
                      </MenuItem>
                      <MenuItem value="Cancelled">
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} /> Cancelled
                        </Box>
                      </MenuItem>
                      <MenuItem value="Scheduled">
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} /> Scheduled
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={handleReset} startIcon={<ClearIcon />} disabled={saving} size="large" sx={{ minWidth: 120 }}>
                      Reset
                    </Button>
                    <Button variant="outlined" onClick={() => navigate(getBackPath())} disabled={saving} size="large" sx={{ minWidth: 120 }}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained"
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={saving || !trainerId} size="large"
                      sx={{
                        minWidth: 160, py: 1.5,
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        '&:hover': { background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)' }
                      }}>
                      {saving ? 'Saving...' : (isEditMode ? 'Update Session' : 'Create Session')}
                    </Button>
                  </Stack>
                </Box>

              </Stack>
            </form>
          </CardContent>
        </Paper>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ minWidth: 300 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AddSession;