import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Analytics,
  Visibility,
  CheckCircle,
  Schedule,
  ArrowForward,
  HourglassEmpty,
  TrendingUp,
  EmojiEvents,
  Cancel,
  Assignment,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import { taskEvaluationAPI } from '../../../services/API/taskEvaluation';
import { useAuth } from '../../../hooks/useAuth';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

const cardSx = {
  borderRadius: '16px',
  bgcolor: '#fff',
  border: '1px solid rgba(41,128,185,0.08)',
  boxShadow:
    '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 24px rgba(26,82,118,0.10)',
    transform: 'translateY(-1px)',
  },
};

/* ——— Score Circle ——— */
const ScoreCircle = ({ score, size = 56 }) => {
  const getColor = (s) => {
    if (s >= 80) return '#0d9488';
    if (s >= 70) return '#2980b9';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };
  const color = getColor(score);
  return (
    <Box
      sx={{
        width: size, height: size, minWidth: size,
        borderRadius: '50%', border: `3px solid ${color}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <Typography
        sx={{ fontSize: '0.5rem', fontWeight: 700, color, lineHeight: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}
      >
        SCORE
      </Typography>
      <Typography sx={{ fontSize: '1rem', fontWeight: 800, color, lineHeight: 1.1 }}>
        {Math.round(score)}%
      </Typography>
    </Box>
  );
};

/* ——— Rating Stars ——— */
const RatingDisplay = ({ rating }) => {
  if (!rating) return null;
  const ratingMap = {
    excellent: { label: 'Excellent', color: '#0d9488', stars: 5 },
    good: { label: 'Good', color: '#2980b9', stars: 4 },
    satisfactory: { label: 'Satisfactory', color: '#f59e0b', stars: 3 },
    'needs improvement': { label: 'Needs Work', color: '#f97316', stars: 2 },
    poor: { label: 'Poor', color: '#ef4444', stars: 1 },
  };
  const r = ratingMap[rating?.toLowerCase()] || { label: rating, color: '#94a3b8', stars: 0 };
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      {Array.from({ length: r.stars }).map((_, i) => (
        <Star key={i} sx={{ fontSize: 14, color: r.color }} />
      ))}
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: r.color, ml: 0.3 }}>
        {r.label}
      </Typography>
    </Box>
  );
};

const TaskEvaluationsPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const studentId = user?.id || user?.studentId || user?.student_id || user?.ID;

  useEffect(() => {
    fetchEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      if (!studentId) {
        setSnackbar({ open: true, message: 'Student ID not found. Please login again.', severity: 'error' });
        setLoading(false);
        return;
      }
      const response = await taskEvaluationAPI.getMyEvaluations(studentId);
      setData(response);
    } catch (error) {
      setSnackbar({ open: true, message: `Error loading evaluations: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  /* ——— Status helper ———
   * Backend returns evaluation_status (snake_case) with values like
   * "completed", "evaluated", "processing", "pending", etc.
   * and passed (boolean).
   */
  const getStatusInfo = (ev) => {
    if (!ev || !ev.evaluation_status) {
      return { label: 'Pending', bg: 'rgba(245,158,11,0.10)', color: '#f59e0b', icon: <HourglassEmpty sx={{ fontSize: '14px !important' }} /> };
    }
    const status = ev.evaluation_status.toLowerCase();
    if (status === 'completed' || status === 'evaluated') {
      if (ev.passed) {
        return { label: 'Passed', bg: 'rgba(13,148,136,0.10)', color: '#0d9488', icon: <CheckCircle sx={{ fontSize: '14px !important' }} /> };
      }
      return { label: 'Failed', bg: 'rgba(239,68,68,0.10)', color: '#ef4444', icon: <Cancel sx={{ fontSize: '14px !important' }} /> };
    }
    if (status === 'processing') {
      return { label: 'Processing', bg: 'rgba(41,128,185,0.10)', color: '#2980b9', icon: <HourglassEmpty sx={{ fontSize: '14px !important' }} /> };
    }
    return { label: ev.evaluation_status, bg: 'rgba(148,163,184,0.10)', color: '#94a3b8', icon: <Schedule sx={{ fontSize: '14px !important' }} /> };
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  if (loading) return <LoadingSpinner message="Loading task evaluations..." />;

  /* ═══ Backend response shape (snake_case) ═══
   * { student_id, student_name, total_evaluations, evaluations: [
   *     { task_name, submitted_date, evaluation_status, overall_score,
   *       passed, rating, strengths, weaknesses, recommendations,
   *       criteria_scores: {
   *         Task_Name: { weight, score },
   *         Objective: { weight, score },
   *         Tools_Software: { weight, score },
   *         Steps_Performed: { weight, score },
   *         Code_Commands: { weight, score, applicable },
   *         Explanation: { weight, score },
   *         Conclusion: { weight, score }
   *       }
   *     }
   * ]}
   */
  const evaluations = data?.evaluations || [];
  const totalEvaluations = data?.total_evaluations || evaluations.length;

  const completedEvals = evaluations.filter((e) => {
    const s = (e.evaluation_status || '').toLowerCase();
    return s === 'completed' || s === 'evaluated';
  });

  const averageScore = completedEvals.length > 0
    ? completedEvals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / completedEvals.length
    : 0;

  const passRate = completedEvals.length > 0
    ? (completedEvals.filter((e) => e.passed).length / completedEvals.length) * 100
    : 0;

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* ═══ Header ═══ */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '11px',
            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Analytics sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Task Evaluations
            </Typography>
            {totalEvaluations > 0 && (
              <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
                {totalEvaluations} evaluation{totalEvaluations !== 1 ? 's' : ''} &bull; {completedEvals.length} completed
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<ArrowForward sx={{ fontSize: '18px !important' }} />}
          onClick={() => navigate('/student/task-submissions')}
          sx={{
            textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
            px: 2.5, fontFamily: fontStack,
            boxShadow: '0 4px 12px rgba(41,128,185,0.25)', '&:hover': { opacity: 0.9 },
          }}
        >
          Task Submissions
        </Button>
      </Box>

      {/* ═══ Stats Cards ═══ */}
      {totalEvaluations > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { icon: <Assignment />, value: totalEvaluations, label: 'Total Evaluations', gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)' },
            { icon: <CheckCircle />, value: completedEvals.length, label: 'Completed', gradient: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)' },
            { icon: <TrendingUp />, value: `${Math.round(averageScore)}%`, label: 'Avg Score', gradient: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)' },
            { icon: <EmojiEvents />, value: `${Math.round(passRate)}%`, label: 'Pass Rate', gradient: 'linear-gradient(135deg, #3498c8 0%, #2db5a0 100%)' },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card sx={{ ...cardSx, '&:hover': { transform: 'none', boxShadow: cardSx.boxShadow } }}>
                <Box sx={{ height: '3px', background: stat.gradient }} />
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                    <Box>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: fontStack }}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 38, height: 38, minWidth: 38, borderRadius: '10px',
                      background: stat.gradient, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', opacity: 0.9, flexShrink: 0,
                    }}>
                      {React.cloneElement(stat.icon, { sx: { color: '#fff', fontSize: 18 } })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ═══ Evaluations List ═══ */}
      {evaluations.length === 0 ? (
        <Box sx={{ p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
          <Analytics sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5, fontFamily: fontStack }}>
            {data?.message || 'No Task Evaluations Yet'}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 2.5, fontFamily: fontStack }}>
            Submit tasks from Trainer Tasks to receive AI evaluations.
          </Typography>
          <Button variant="contained" startIcon={<ArrowForward />}
            onClick={() => navigate('/student/tasks')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', fontFamily: fontStack }}>
            View Trainer Tasks
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {evaluations.map((ev, index) => {
            const statusInfo = getStatusInfo(ev);
            const status = (ev.evaluation_status || '').toLowerCase();
            const isCompleted = status === 'completed' || status === 'evaluated';

            return (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={cardSx}>
                  {/* Top color bar */}
                  <Box sx={{
                    height: '3px',
                    background: isCompleted
                      ? ev.passed
                        ? 'linear-gradient(90deg, #0d9488 0%, #5eead4 100%)'
                        : 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)'
                      : 'linear-gradient(90deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)',
                  }} />
                  <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                    {/* Header row */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '8px',
                          background: isCompleted
                            ? ev.passed
                              ? 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)'
                              : 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
                            : 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Assignment sx={{ color: '#fff', fontSize: 16 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                            {ev.task_name
                              ? ev.task_name.length > 28
                                ? ev.task_name.substring(0, 28) + '...'
                                : ev.task_name
                              : `Evaluation #${index + 1}`}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                            Submitted {formatDate(ev.submitted_date)}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip icon={statusInfo.icon} label={statusInfo.label} size="small"
                        sx={{
                          height: 24, fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px',
                          bgcolor: statusInfo.bg, color: statusInfo.color,
                          '& .MuiChip-icon': { color: statusInfo.color },
                        }}
                      />
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)', mb: 1.5 }} />

                    {/* Evaluation Content */}
                    {isCompleted ? (
                      <Box>
                        {/* Score + Rating row */}
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <ScoreCircle score={ev.overall_score} />
                          <Box sx={{ textAlign: 'right' }}>
                            <RatingDisplay rating={ev.rating} />
                            <Chip
                              label={ev.passed ? 'PASSED' : 'FAILED'} size="small"
                              sx={{
                                mt: 0.5, height: 20, fontSize: '0.58rem', fontWeight: 800,
                                letterSpacing: '0.06em', borderRadius: '5px',
                                bgcolor: ev.passed ? 'rgba(13,148,136,0.10)' : 'rgba(239,68,68,0.10)',
                                color: ev.passed ? '#0d9488' : '#ef4444',
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Top 3 criteria mini-bars */}
                        {ev.criteria_scores && (
                          <Box display="flex" flexDirection="column" gap={0.8}>
                            {[
                              { label: 'Steps Performed', score: ev.criteria_scores.Steps_Performed?.score || 0, weight: '50%' },
                              { label: 'Code/Commands', score: ev.criteria_scores.Code_Commands?.score || 0, weight: '20%' },
                              { label: 'Explanation', score: ev.criteria_scores.Explanation?.score || 0, weight: '10%' },
                            ].map((c) => (
                              <Box key={c.label}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.2}>
                                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontFamily: fontStack }}>
                                    {c.label} <span style={{ color: '#94a3b8' }}>({c.weight})</span>
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                                    {Math.round(c.score)}%
                                  </Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={c.score}
                                  sx={{
                                    height: 4, borderRadius: 2, bgcolor: 'rgba(41,128,185,0.08)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 2,
                                      bgcolor: c.score >= 80 ? '#0d9488' : c.score >= 60 ? '#2980b9' : c.score >= 40 ? '#f59e0b' : '#ef4444',
                                    },
                                  }}
                                />
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.10)', textAlign: 'center' }}>
                        <HourglassEmpty sx={{ fontSize: 28, color: '#f59e0b', mb: 0.5 }} />
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400e', fontFamily: fontStack }}>
                          Evaluation Pending
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#b45309', fontFamily: fontStack }}>
                          AI evaluation is in progress. Check back soon.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
                    {isCompleted && (
                      <Button
                        variant="outlined"
                        startIcon={<Visibility sx={{ fontSize: '16px !important' }} />}
                        size="small"
                        onClick={() => navigate(
                          `/student/task-evaluations/view/${index}`,
                          { state: { evaluation: ev, studentName: data?.student_name } }
                        )}
                        sx={{
                          textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px',
                          borderColor: 'rgba(41,128,185,0.20)', color: '#2980b9', fontFamily: fontStack,
                          '&:hover': { borderColor: '#2980b9' },
                        }}
                      >
                        View Results
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskEvaluationsPage;