import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  Save,
  Cancel,
  Assignment,
  Group,
  ArrowBack,
  EditNote,
  Layers,
  ViewModule,
  HelpOutline
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { trainerTasksAPI } from '../../../services/API/trainertasks';
import { AuthContext } from '../../../context/AuthContext';

/* ── shared sx tokens ── */
const cardSx = {
  borderRadius: '14px',
  border: '1px solid #E2E8F0',
  boxShadow: 'none',
};

/* ── Light Blue Gradient Tokens ── */
const gradientBg = 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)';
const gradientHover = 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)';
const gradientShadow = '0 8px 24px rgba(59,130,246,0.35)';
const gradientShadowHover = '0 12px 32px rgba(59,130,246,0.45)';

/**
 * AddTrainerTask
 *
 * UPDATED to match backend:
 *   POST /api/trainer/session/<session_id>/task/create
 *   Body: { Task_Box, Trainer_ID }
 *   Batch_ID is auto-derived from the session by the backend.
 *
 * This component can be used in two ways:
 *   1. From a session detail page (session_id in URL params) — preferred
 *   2. Standalone (user types Session ID manually) — fallback
 */
const AddTrainerTask = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // If navigated from session detail, session_id may be in URL params
  const { session_id: urlSessionId } = useParams();

  const [formData, setFormData] = useState({
    Task_Box: '',
    Session_ID: urlSessionId || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // If session_id comes from URL, pre-fill it
  useEffect(() => {
    if (urlSessionId) {
      setFormData(prev => ({ ...prev, Session_ID: urlSessionId }));
    }
  }, [urlSessionId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.Session_ID || !formData.Session_ID.toString().trim()) {
      newErrors.Session_ID = 'Session ID is required';
    } else if (isNaN(formData.Session_ID) || parseInt(formData.Session_ID) <= 0) {
      newErrors.Session_ID = 'Session ID must be a valid positive number';
    }

    if (!formData.Task_Box.trim()) {
      newErrors.Task_Box = 'Task content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setSnackbar({
        open: true,
        message: 'Trainer ID not found. Please log in again.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // API: addTask(sessionId, taskBox, trainerId)
      // Backend auto-derives Batch_ID from the session
      const response = await trainerTasksAPI.addTask(
        parseInt(formData.Session_ID),
        formData.Task_Box.trim(),
        user.id
      );

      console.log('Task created successfully:', response);

      setSnackbar({
        open: true,
        message: `Task created successfully! ${response.Task_ID ? `Task ID: ${response.Task_ID}` : ''}`,
        severity: 'success'
      });

      // Navigate back after short delay
      setTimeout(() => {
        navigate('/trainer/tasks');
      }, 2000);

    } catch (error) {
      console.error('Error creating task:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create task. Please try again.',
        severity: 'error'
      });
      setErrors({ submit: error.message || 'Failed to create task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/trainer/tasks');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Parse questions from Task_Box for preview
  const parseQuestions = (taskBox) => {
    if (!taskBox.trim()) return [];
    return taskBox.split('?').map(q => q.trim()).filter(q => q).map(q => q.endsWith('?') ? q : q + '?');
  };

  const questions = parseQuestions(formData.Task_Box);

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* ──── Snackbar ──── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ═══════════ HEADER ═══════════ */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          {/* Back button */}
          <Button
            startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
            onClick={handleCancel}
            sx={{
              color: '#64748B',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              borderRadius: '10px',
              px: 1.5,
              mb: 1.5,
              '&:hover': { bgcolor: '#F1F5F9', color: '#3B82F6' },
              transition: 'all 0.2s ease',
            }}
          >
            Back to Tasks
          </Button>

          <Box display="flex" alignItems="center" gap={2} mb={0.5}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                fontSize: '2rem',
                letterSpacing: '-0.02em',
              }}
            >
              Create New Task
            </Typography>
            <Chip
              label="NEW"
              size="small"
              sx={{
                bgcolor: '#16A34A',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '0.06em',
                height: 24,
                borderRadius: '12px',
                '& .MuiChip-label': { px: 1.2 },
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: '#64748B', fontSize: '0.9rem', maxWidth: 520, lineHeight: 1.5 }}
          >
            Enter the Session ID and task content. The Batch is automatically determined from the session.
          </Typography>
        </Box>

        {/* Save floating button */}
        <IconButton
          onClick={handleSubmit}
          disabled={loading || !formData.Session_ID || !formData.Task_Box}
          sx={{
            width: 52,
            height: 52,
            backgroundImage: loading || !formData.Session_ID || !formData.Task_Box ? 'none' : gradientBg,
            bgcolor: loading || !formData.Session_ID || !formData.Task_Box ? '#CBD5E1' : 'transparent',
            color: '#fff',
            boxShadow: gradientShadow,
            '&:hover': {
              backgroundImage: gradientHover,
              bgcolor: 'transparent',
              boxShadow: gradientShadowHover,
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': { backgroundImage: 'none', bgcolor: '#CBD5E1', color: '#fff' },
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : <Save sx={{ fontSize: 24 }} />}
        </IconButton>
      </Box>

      {/* ═══════════ ERROR ALERT ═══════════ */}
      {errors.submit && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '10px', border: '1px solid #FECACA' }}
          onClose={() => setErrors(prev => ({ ...prev, submit: '' }))}
        >
          {errors.submit}
        </Alert>
      )}

      {/* ═══════════ FORM CONTENT ═══════════ */}
      <form onSubmit={handleSubmit}>
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', lg: 'row' } }}>

          {/* ────── LEFT: Form Fields ────── */}
          <Box sx={{ flex: 1.2 }}>
            <Paper elevation={0} sx={{ ...cardSx, p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Assignment sx={{ color: '#2563EB', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                    Task Information
                  </Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                    Set the session and task content
                  </Typography>
                </Box>
              </Box>

              {/* Info banner */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#F0F9FF',
                  borderRadius: '10px',
                  border: '1px solid #BAE6FD',
                  mb: 3,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <HelpOutline sx={{ color: '#0284C7', fontSize: 20, mt: 0.1 }} />
                <Typography variant="body2" sx={{ color: '#0369A1', fontSize: '0.8rem', lineHeight: 1.6 }}>
                  <strong>How it works:</strong> Enter a valid Session ID and the task content.
                  The Batch ID is automatically derived from the session by the system.
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {/* Session ID */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      border: `1px solid ${errors.Session_ID ? '#FECACA' : '#E2E8F0'}`,
                      bgcolor: errors.Session_ID ? '#FFF5F5' : '#fff',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: errors.Session_ID ? '#F87171' : '#CBD5E1' },
                      '&:focus-within': { borderColor: '#3B82F6', boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          bgcolor: '#FFF7ED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Layers sx={{ fontSize: 16, color: '#EA580C' }} />
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>
                        Session ID <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      name="Session_ID"
                      type="number"
                      value={formData.Session_ID}
                      onChange={handleInputChange}
                      error={!!errors.Session_ID}
                      helperText={errors.Session_ID || 'Batch will be auto-determined from this session'}
                      required
                      disabled={loading || !!urlSessionId}
                      inputProps={{ min: 1 }}
                      placeholder="e.g., 1"
                      variant="standard"
                      sx={{
                        '& .MuiInput-root': {
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: '#0F172A',
                          '&::before': { borderColor: '#E2E8F0' },
                          '&:hover:not(.Mui-disabled)::before': { borderColor: '#CBD5E1' },
                          '&.Mui-focused::after': { borderColor: '#3B82F6' },
                        },
                        '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 1 },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Batch ID info (read-only) */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      bgcolor: '#F8FAFC',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          bgcolor: '#F0FDF4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Group sx={{ fontSize: 16, color: '#16A34A' }} />
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>
                        Batch ID
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>
                      Auto-determined from Session
                    </Typography>
                  </Box>
                </Grid>

                {/* Task Content */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${errors.Task_Box ? '#FECACA' : '#E2E8F0'}`,
                      bgcolor: errors.Task_Box ? '#FFF5F5' : '#fff',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: errors.Task_Box ? '#F87171' : '#CBD5E1' },
                      '&:focus-within': { borderColor: '#3B82F6', boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          bgcolor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <EditNote sx={{ fontSize: 16, color: '#2563EB' }} />
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>
                        Task Content <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                      </Typography>
                      {formData.Task_Box && (
                        <Chip
                          label={`${questions.length} question${questions.length !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{
                            ml: 'auto',
                            height: 22,
                            bgcolor: '#EFF6FF',
                            color: '#2563EB',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            borderRadius: '6px',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      name="Task_Box"
                      value={formData.Task_Box}
                      onChange={handleInputChange}
                      error={!!errors.Task_Box}
                      helperText={errors.Task_Box || 'Enter the task questions or content. Separate questions with question marks.'}
                      required
                      disabled={loading}
                      placeholder="What is python?, What are arrays?, How do you create a function in JavaScript?"
                      variant="standard"
                      sx={{
                        '& .MuiInput-root': {
                          fontSize: '0.9rem',
                          lineHeight: 1.7,
                          color: '#1E293B',
                          '&::before': { borderColor: '#E2E8F0' },
                          '&:hover:not(.Mui-disabled)::before': { borderColor: '#CBD5E1' },
                          '&.Mui-focused::after': { borderColor: '#3B82F6' },
                        },
                        '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 1 },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* ────── ACTION BUTTONS ────── */}
            <Box display="flex" gap={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<Cancel />}
                disabled={loading}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#E2E8F0',
                  color: '#64748B',
                  px: 3,
                  py: 1.2,
                  '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <Save />}
                disabled={loading || !formData.Session_ID || !formData.Task_Box}
                sx={{
                  backgroundImage: gradientBg,
                  bgcolor: 'transparent',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                  '&:hover': { backgroundImage: gradientHover, bgcolor: 'transparent' },
                  '&.Mui-disabled': { backgroundImage: 'none', bgcolor: '#94A3B8', color: '#fff' },
                }}
              >
                {loading ? 'Creating Task...' : 'Create Task'}
              </Button>
            </Box>
          </Box>

          {/* ────── RIGHT: Live Preview ────── */}
          <Box sx={{ flex: 0.8, minWidth: 320 }}>
            <Paper
              elevation={0}
              sx={{
                ...cardSx,
                overflow: 'hidden',
                position: 'sticky',
                top: 24,
              }}
            >
              {/* Preview Header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ViewModule sx={{ color: '#94A3B8', fontSize: 18 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Preview
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                {!formData.Task_Box && !formData.Session_ID ? (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Box sx={{ mb: 2, fontSize: 42, opacity: 0.3 }}>📋</Box>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500 }}>
                      Start filling in the form to see a live preview
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Task title bar */}
                    <Box display="flex" alignItems="flex-start" gap={1.5} mb={2.5}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          bgcolor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Assignment sx={{ color: '#2563EB', fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', lineHeight: 1.3 }}>
                          New Task — Session {formData.Session_ID || 'XX'}
                        </Typography>
                        <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', mt: 0.3 }}>
                          Training task containing {questions.length} question{questions.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Meta chips */}
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2.5}>
                      <Chip
                        label={`Session: ${formData.Session_ID || 'Not set'}`}
                        size="small"
                        sx={{
                          height: 26,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          bgcolor: formData.Session_ID ? '#FFF7ED' : '#F1F5F9',
                          color: formData.Session_ID ? '#EA580C' : '#94A3B8',
                          border: '1px solid',
                          borderColor: formData.Session_ID ? '#FED7AA' : '#E2E8F0',
                          borderRadius: '8px',
                          '& .MuiChip-label': { px: 0.8 },
                        }}
                      />
                      <Chip
                        label="Batch: Auto"
                        size="small"
                        sx={{
                          height: 26,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          bgcolor: '#F0FDF4',
                          color: '#16A34A',
                          border: '1px solid #BBF7D0',
                          borderRadius: '8px',
                          '& .MuiChip-label': { px: 0.8 },
                        }}
                      />
                      <Chip
                        label="Training"
                        size="small"
                        sx={{
                          height: 26,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          bgcolor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: '8px',
                          '& .MuiChip-label': { px: 0.8 },
                        }}
                      />
                    </Box>

                    {/* Questions list */}
                    {questions.length > 0 && (
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            mb: 1.5,
                          }}
                        >
                          Questions ({questions.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {questions.map((question, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                p: 1.5,
                                borderRadius: '10px',
                                bgcolor: '#F8FAFC',
                                border: '1px solid #F1F5F9',
                                transition: 'all 0.15s ease',
                                '&:hover': { bgcolor: '#EFF6FF', borderColor: '#BFDBFE' },
                              }}
                            >
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '7px',
                                  backgroundImage: gradientBg,
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  flexShrink: 0,
                                  mt: 0.1,
                                }}
                              >
                                {index + 1}
                              </Box>
                              <Typography sx={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                                {question}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Raw content */}
                    {formData.Task_Box && (
                      <Box
                        sx={{
                          mt: 2.5,
                          pt: 2,
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            mb: 1,
                          }}
                        >
                          Raw Content
                        </Typography>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: '8px',
                            bgcolor: '#F8FAFC',
                            border: '1px solid #F1F5F9',
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: '#64748B',
                              fontFamily: 'monospace',
                              wordBreak: 'break-word',
                              lineHeight: 1.6,
                            }}
                          >
                            "{formData.Task_Box}"
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default AddTrainerTask;