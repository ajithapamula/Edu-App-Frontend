import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Skeleton,
  Fade,
  Slide,
  alpha,
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Person,
  CalendarToday,
  CheckCircle,
  Warning,
  Info,
  Download,
  ArrowBack,
  QuestionAnswer,
  Category,
  Groups,
  AccessTime,
  EventAvailable,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerTasksAPI } from '../../../services/API/trainertasks';
import { AuthContext } from '../../../context/AuthContext';

// ── Design tokens matching dashboard ──────────────────────────────────────
const colors = {
  primary: '#2980b9',
  primaryDark: '#1a5276',
  teal: '#0d9488',
  dark: '#0f172a',
  subtle: '#64748b',
  muted: '#94a3b8',
  bg: '#f0f4f8',
  cardBorder: 'rgba(41,128,185,0.08)',
  cardShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
  gradientPrimary: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  gradientTeal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
  gradientMixed: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)',
};

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

// ── Shimmer Skeleton ───────────────────────────────────────────────────────
const ViewTrainerTaskShimmer = () => (
  <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 3 }}>
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {/* Header shimmer */}
      <Box sx={{ mb: 3, p: 3, borderRadius: '18px', bgcolor: '#dde4ed' }}>
        <Skeleton variant="rectangular" width={130} height={38} sx={{ borderRadius: '10px', mb: 2 }} />
        <Skeleton variant="text" width="35%" height={36} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width={160} height={26} sx={{ borderRadius: '8px' }} />
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${colors.cardBorder}`, p: 3, mb: 2.5 }}>
            <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" height={18} sx={{ mb: 0.8 }} />
            <Skeleton variant="text" width="90%" height={18} sx={{ mb: 2 }} />
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={6} md={3} key={i}>
                  <Skeleton variant="text" width={70} height={14} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width={90} height={20} />
                </Grid>
              ))}
            </Grid>
          </Paper>
          <Paper elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${colors.cardBorder}`, p: 3 }}>
            <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1.5} mb={1.5}>
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="text" width="80%" height={18} />
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${colors.cardBorder}`, p: 3 }}>
            <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} display="flex" justifyContent="space-between" mb={1}>
                <Skeleton variant="text" width="40%" height={18} />
                <Skeleton variant="text" width="40%" height={18} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
        <CircularProgress size={18} sx={{ mr: 1, color: colors.primary }} />
        <Typography variant="body2" sx={{ color: colors.subtle, fontFamily: fontStack }}>
          Loading task details...
        </Typography>
      </Box>
    </Box>
  </Box>
);

// ── Summary row item ───────────────────────────────────────────────────────
const SummaryRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}
    sx={{ borderBottom: `1px solid ${colors.cardBorder}`, '&:last-child': { borderBottom: 0 } }}>
    <Typography sx={{ fontSize: '0.82rem', color: colors.subtle, fontFamily: fontStack }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: colors.dark, fontFamily: fontStack }}>{value}</Typography>
  </Box>
);

// ── Meta info chip ─────────────────────────────────────────────────────────
const MetaItem = ({ icon, label, value }) => (
  <Box>
    <Box display="flex" alignItems="center" gap={0.6} mb={0.4}>
      {React.cloneElement(icon, { sx: { fontSize: 15, color: colors.muted } })}
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: fontStack }}>
        {label}
      </Typography>
    </Box>
    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: colors.dark, fontFamily: fontStack }}>
      {value || '—'}
    </Typography>
  </Box>
);

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
const ViewTrainerTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── ALL BACKEND LOGIC COMPLETELY UNCHANGED ─────────────────────────────
  useEffect(() => {
    if (id && id !== 'undefined' && user?.id) {
      fetchTask();
    } else if (!id || id === 'undefined') {
      setError('Invalid task ID provided');
      setLoading(false);
    }
  }, [id, user?.id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError('');
      if (!id || id === 'undefined' || id === 'null') throw new Error('Invalid task ID');
      const response = await trainerTasksAPI.getTaskById(id, user?.id);
      console.log('API Response:', response);
      if (!response) throw new Error('No data received from server');
      const transformedTask = transformApiResponse(response);
      setTask(transformedTask);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to fetch task details: ' + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const transformApiResponse = (apiData) => {
    if (!apiData) return null;
    const taskData = Array.isArray(apiData) ? apiData[0] : apiData;
    if (!taskData) return null;
    const taskContent = taskData.Task_Content || taskData.Task_Box || '';
    const questions = taskContent
      ? taskContent.split('?').map(q => q.trim()).filter(q => q).map(q => q.endsWith('?') ? q : q + '?')
      : [];
    return {
      id: taskData.Task_ID || taskData.ID,
      batchId: taskData.Batch_ID,
      batchCode: taskData.Batch_Code,
      sessionId: taskData.Session_ID,
      title: `Task #${taskData.Task_ID || taskData.ID}`,
      description: `Training task for Batch "${taskData.Batch_Code || taskData.Batch_ID}" — Session ${taskData.Session_ID} — containing ${questions.length} question${questions.length !== 1 ? 's' : ''}`,
      questions: questions,
      taskContent: taskContent,
      startDateTime: taskData.Start_DateTime || null,
      endDateTime: taskData.End_DateTime || null,
    };
  };
  // ── END BACKEND LOGIC ──────────────────────────────────────────────────

  if (loading) return <ViewTrainerTaskShimmer />;

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/trainer/tasks')}
            sx={{
              mb: 2, textTransform: 'none', fontWeight: 600, borderRadius: '10px',
              color: colors.primary, fontFamily: fontStack,
            }}
          >
            Back to Tasks
          </Button>
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>
          <Button variant="contained" onClick={fetchTask}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', background: colors.gradientPrimary }}>
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/trainer/tasks')}
            sx={{ mb: 2, textTransform: 'none', fontWeight: 600, color: colors.primary, fontFamily: fontStack }}>
            Back to Tasks
          </Button>
          <Alert severity="warning" sx={{ borderRadius: '12px' }}>Task not found</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, py: 3, fontFamily: fontStack }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>

        {/* ── Gradient Header ───────────────────────────────────────────── */}
        <Fade in timeout={500}>
          <Box sx={{
            mb: 3, p: { xs: 2.5, sm: 3 },
            borderRadius: '18px',
            background: colors.gradientMixed,
            boxShadow: '0 4px 24px rgba(26,82,118,0.18)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <Box sx={{ position: 'absolute', top: -40, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <Box sx={{ position: 'absolute', bottom: -30, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <Box position="relative" zIndex={1}>
              {/* Back button */}
              <Button
                startIcon={<ArrowBack sx={{ fontSize: '18px !important' }} />}
                onClick={() => navigate('/trainer/tasks')}
                sx={{
                  mb: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
                  borderRadius: '9px',
                  bgcolor: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff', px: 2, py: 0.7,
                  fontFamily: fontStack,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.26)' },
                }}
              >
                Back to Tasks
              </Button>

              <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                <Box>
                  <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                    <Box sx={{
                      width: 42, height: 42, borderRadius: '12px',
                      bgcolor: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Assignment sx={{ color: '#fff', fontSize: 22 }} />
                    </Box>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: fontStack, letterSpacing: '-0.01em' }}>
                      {task.title}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.70)', fontFamily: fontStack, ml: 0.5 }}>
                    {task.description}
                  </Typography>
                </Box>

                {task.batchCode && (
                  <Chip
                    label={task.batchCode}
                    sx={{
                      fontWeight: 700, fontSize: '0.78rem',
                      bgcolor: 'rgba(255,255,255,0.20)',
                      border: '1px solid rgba(255,255,255,0.30)',
                      color: '#fff', borderRadius: '8px', height: 28,
                      fontFamily: fontStack,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Fade>

        <Grid container spacing={2.5}>

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <Grid item xs={12} md={8}>
            <Slide in direction="up" timeout={500}>
              <Box>

                {/* Task Description Card */}
                <Paper elevation={0} sx={{
                  mb: 2.5, borderRadius: '18px',
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: colors.cardShadow,
                  background: '#fff', overflow: 'hidden',
                }}>
                  <Box sx={{ height: '3px', background: colors.gradientMixed }} />
                  <Box p={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                      <Box sx={{
                        width: 34, height: 34, borderRadius: '10px',
                        background: colors.gradientPrimary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Info sx={{ color: '#fff', fontSize: 17 }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: colors.dark, fontFamily: fontStack }}>
                        Task Description
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 2, borderRadius: '12px',
                      bgcolor: alpha(colors.primary, 0.04),
                      border: `1px solid ${alpha(colors.primary, 0.08)}`,
                      mb: 2.5,
                    }}>
                      <Typography sx={{ fontSize: '0.9rem', color: colors.subtle, lineHeight: 1.7, fontFamily: fontStack }}>
                        {task.description}
                      </Typography>
                    </Box>

                    <Divider sx={{ borderColor: colors.cardBorder, mb: 2.5 }} />

                    {/* Meta grid */}
                    <Grid container spacing={2.5}>
                      <Grid item xs={6} md={3}>
                        <MetaItem icon={<Assignment />} label="Task ID" value={`#${task.id}`} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <MetaItem icon={<Groups />} label="Batch" value={task.batchCode || task.batchId} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <MetaItem icon={<Schedule />} label="Session ID" value={task.sessionId} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <MetaItem icon={<CalendarToday />} label="Session Date" value={task.startDateTime || 'N/A'} />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>

                {/* Task Questions Card */}
                <Paper elevation={0} sx={{
                  borderRadius: '18px',
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: colors.cardShadow,
                  background: '#fff', overflow: 'hidden',
                }}>
                  <Box sx={{ height: '3px', background: colors.gradientTeal }} />
                  <Box p={3}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{
                          width: 34, height: 34, borderRadius: '10px',
                          background: colors.gradientTeal,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <QuestionAnswer sx={{ color: '#fff', fontSize: 17 }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: colors.dark, fontFamily: fontStack }}>
                          Task Questions
                        </Typography>
                      </Box>
                      <Chip
                        label={`${task.questions.length} question${task.questions.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.72rem', height: 24, borderRadius: '7px',
                          bgcolor: alpha(colors.teal, 0.10), color: colors.teal,
                          fontFamily: fontStack,
                        }}
                      />
                    </Box>

                    {task.questions.length > 0 ? (
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        {task.questions.map((question, index) => (
                          <Box
                            key={index}
                            display="flex"
                            alignItems="flex-start"
                            gap={1.5}
                            sx={{
                              p: 2, borderRadius: '12px',
                              bgcolor: index % 2 === 0
                                ? alpha(colors.teal, 0.04)
                                : alpha(colors.primary, 0.03),
                              border: `1px solid ${index % 2 === 0 ? alpha(colors.teal, 0.10) : alpha(colors.primary, 0.07)}`,
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                bgcolor: alpha(colors.teal, 0.07),
                                borderColor: alpha(colors.teal, 0.18),
                              },
                            }}
                          >
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px',
                              background: colors.gradientTeal,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, mt: 0.1,
                            }}>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', fontFamily: fontStack }}>
                                {index + 1}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.dark, fontFamily: fontStack, lineHeight: 1.6 }}>
                              {question}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{
                        p: 3, textAlign: 'center', borderRadius: '12px',
                        bgcolor: alpha(colors.muted, 0.06),
                        border: `1px dashed ${alpha(colors.muted, 0.3)}`,
                      }}>
                        <Typography sx={{ fontSize: '0.88rem', color: colors.muted, fontFamily: fontStack }}>
                          No questions available for this task.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>

              </Box>
            </Slide>
          </Grid>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 80 }}>
              <Paper elevation={0} sx={{
                borderRadius: '18px',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: colors.cardShadow,
                background: '#fff', overflow: 'hidden',
              }}>
                <Box sx={{ height: '3px', background: colors.gradientPrimary }} />
                <Box p={2.5}>
                  <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                    <Box sx={{
                      width: 34, height: 34, borderRadius: '10px',
                      background: colors.gradientPrimary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Info sx={{ color: '#fff', fontSize: 17 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: colors.dark, fontFamily: fontStack }}>
                      Task Summary
                    </Typography>
                  </Box>

                  {/* Total Questions Highlight */}
                  <Box sx={{
                    p: 2, mb: 2, borderRadius: '12px',
                    background: colors.gradientPrimary,
                    boxShadow: '0 4px 14px rgba(41,128,185,0.25)',
                    textAlign: 'center',
                  }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5, fontFamily: fontStack }}>
                      Total Questions
                    </Typography>
                    <Typography sx={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: fontStack }}>
                      {task.questions.length}
                    </Typography>
                  </Box>

                  {/* Summary rows */}
                  <SummaryRow label="Task ID:" value={`#${task.id}`} />
                  <SummaryRow label="Batch:" value={task.batchCode || task.batchId} />
                  <SummaryRow label="Session ID:" value={task.sessionId} />
                  <SummaryRow label="Questions:" value={task.questions.length} />
                  {task.startDateTime && (
                    <SummaryRow label="Start:" value={task.startDateTime} />
                  )}
                  {task.endDateTime && (
                    <SummaryRow label="End:" value={task.endDateTime} />
                  )}
                </Box>
              </Paper>
            </Box>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
};

export default ViewTrainerTask;