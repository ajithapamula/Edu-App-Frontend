import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Avatar,
  Alert,
  Button,
  Skeleton,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  AssessmentOutlined,
  Download,
  Print,
  Refresh,
  CheckCircleOutlined,
  TimerOutlined,
  TrendingUpOutlined,
  PersonOutlined,
  AnalyticsOutlined,
  SchoolOutlined,
  WorkOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { weeklyInterviewsAPI } from '../../../services/API/mockinterviews';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* ——— Stat Card ——— */
const StatCard = ({ icon, label, value, gradient }) => (
  <Box
    sx={{
      p: 2.5, borderRadius: '14px', bgcolor: '#fff',
      border: '1px solid rgba(41,128,185,0.08)',
      boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
      display: 'flex', alignItems: 'center', gap: 2,
      transition: 'all 0.2s ease',
      '&:hover': { boxShadow: '0 4px 16px rgba(26,82,118,0.08)', transform: 'translateY(-1px)' },
    }}
  >
    <Box
      sx={{
        width: 42, height: 42, borderRadius: '11px', background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontFamily: fontStack, letterSpacing: '0.02em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

/* ——— Shimmer Loading ——— */
const ViewInterviewShimmer = () => (
  <Box>
    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
      <Skeleton variant="circular" width={34} height={34} />
      <Skeleton variant="text" width={240} height={36} />
    </Box>
    <Box sx={{ p: 3, mb: 3, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Skeleton variant="circular" width={64} height={64} />
        <Box>
          <Skeleton variant="text" width={200} height={28} />
          <Skeleton variant="text" width={140} height={18} />
          <Box display="flex" gap={1} mt={0.5}>
            <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: '6px' }} />
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '6px' }} />
          </Box>
        </Box>
      </Box>
    </Box>
    <Box sx={{ p: 3, mb: 3, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '14px' }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  </Box>
);

const ViewMockInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (id) fetchInterview(); }, [id]);

  const fetchInterview = async () => {
    setLoading(true);
    setError(null);
    try {
      const allInterviews = await weeklyInterviewsAPI.getAllInterviews();
      const found = allInterviews.find(
        (i) => i.test_id === id || i.id === id || i.Student_ID === id || i.student_id === id
      );
      if (found) {
        setInterview(weeklyInterviewsAPI.transformInterviewData(found));
      } else {
        setError('Interview not found');
      }
    } catch (err) {
      console.error('Failed to load interview:', err);
      setError('Failed to load interview data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchInterview();

  const getScoreColor = (score) => {
    if (score >= 8) return '#0d9488';
    if (score >= 6) return '#d97706';
    if (score >= 4) return '#2980b9';
    return '#dc2626';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'rgba(13,148,136,0.10)';
    if (score >= 6) return 'rgba(217,119,6,0.10)';
    if (score >= 4) return 'rgba(41,128,185,0.10)';
    return 'rgba(220,38,38,0.10)';
  };

  const getScoreGradient = (score) => {
    if (score >= 8) return 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)';
    if (score >= 6) return 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)';
    if (score >= 4) return 'linear-gradient(135deg, #2980b9 0%, #5dade2 100%)';
    return 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: 'N/A', time: 'N/A' };
    let date;
    if (typeof timestamp === 'number') { date = new Date(timestamp * 1000); } else { date = new Date(timestamp); }
    if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  const getInitials = (name) => {
    if (!name || name === 'Unknown Student' || name === 'No Name') return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return <ViewInterviewShimmer />;

  if (error || !interview) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', boxShadow: '0 4px 16px rgba(239,68,68,0.10)' }}>
          {error || "Interview not found or you don't have permission to view it."}
        </Alert>
        <Button
          onClick={() => navigate('/trainer/mock-interviews')}
          startIcon={<ArrowBack sx={{ fontSize: '18px !important' }} />}
          variant="outlined"
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
            borderRadius: '10px', borderColor: 'rgba(41,128,185,0.20)',
            color: '#2980b9', px: 2.5, fontFamily: fontStack,
            '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
          }}
        >
          Back to List
        </Button>
      </Box>
    );
  }

  const dateTime = formatTimestamp(interview.timestamp);
  const studentName = interview.studentName || interview.student_name || interview.name || 'Unknown Student';
  const studentId = interview.studentId || interview.Student_ID || 'N/A';
  const testId = interview.testId || interview.test_id || 'N/A';
  const sessionId = interview.sessionId || interview.session_id || 'N/A';

  const hasScores =
    interview.overallScore !== null || interview.technicalScore !== null ||
    interview.communicationScore !== null || interview.hrScore !== null ||
    interview.scores?.overall_score !== null || interview.scores?.technical_score !== null ||
    interview.scores?.communication_score !== null || interview.scores?.hr_score !== null;

  const scoreMetrics = [
    { label: 'Overall', value: interview.scores?.overall_score ?? interview.overallScore, gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', icon: <TrendingUpOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
    { label: 'Technical', value: interview.scores?.technical_score ?? interview.technicalScore, gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', icon: <AnalyticsOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
    { label: 'Communication', value: interview.scores?.communication_score ?? interview.communicationScore, gradient: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)', icon: <SchoolOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
    { label: 'HR Skills', value: interview.scores?.hr_score ?? interview.hrScore, gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', icon: <WorkOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
  ].filter((m) => m.value !== null && m.value !== undefined);

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            onClick={() => navigate('/trainer/mock-interviews')}
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(41,128,185,0.12)' },
            }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
          </IconButton>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: '11px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AssessmentOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Interview Assessment
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} sx={{ width: 34, height: 34, borderRadius: '9px', color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' } }}>
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Report">
            <IconButton sx={{ width: 34, height: 34, borderRadius: '9px', color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' } }}>
              <Download sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Details">
            <IconButton sx={{ width: 34, height: 34, borderRadius: '9px', color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' } }}>
              <Print sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Student Info Card */}
      <Box
        sx={{
          p: 3, mb: 3, borderRadius: '16px', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
        }}
      >
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            sx={{
              width: 64, height: 64, mr: 2.5, fontSize: '1.2rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              fontFamily: fontStack,
            }}
          >
            {getInitials(studentName)}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack, mb: 0.3 }}>
              {studentName}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack, mb: 0.8 }}>
              Student ID: {studentId}
            </Typography>
            <Box display="flex" gap={0.8} alignItems="center" flexWrap="wrap">
              <Chip label="Weekly Interview" size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', fontFamily: fontStack, bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276' }} />
              <Chip label={`Session ${sessionId}`} size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', fontFamily: fontStack, bgcolor: 'rgba(124,58,237,0.08)', color: '#7c3aed' }} />
              {hasScores && (
                <Chip label="Assessed" size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', fontFamily: fontStack, bgcolor: 'rgba(13,148,136,0.10)', color: '#0d9488' }} />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ height: '1px', bgcolor: 'rgba(41,128,185,0.08)', mb: 3 }} />

        {/* Interview Details Table */}
        <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(41,128,185,0.08)' }}>
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(41,128,185,0.08)', bgcolor: 'rgba(41,128,185,0.02)' }}>
            <AssessmentOutlined sx={{ fontSize: 16, color: '#1a5276' }} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a5276', fontFamily: fontStack }}>
              Interview Details
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(41,128,185,0.04)' }}>
                  {['Test ID', 'Session ID', 'Test Date', 'Test Time', 'Status'].map((h) => (
                    <TableCell key={h}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' } }}>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a5276', fontFamily: 'monospace' }}>
                      {testId.length > 8 ? `${testId.substring(0, 8)}...` : testId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={sessionId} size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276', borderRadius: '6px', fontFamily: fontStack }} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                      {dateTime.date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>
                      {dateTime.time}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={hasScores ? 'Completed' : 'Pending'}
                      size="small"
                      icon={hasScores
                        ? <CheckCircleOutlined sx={{ fontSize: '14px !important' }} />
                        : <TimerOutlined sx={{ fontSize: '14px !important' }} />}
                      sx={{
                        height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', fontFamily: fontStack,
                        bgcolor: hasScores ? 'rgba(13,148,136,0.10)' : 'rgba(217,119,6,0.10)',
                        color: hasScores ? '#0d9488' : '#d97706',
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Performance Overview */}
      <Box
        sx={{
          borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(41,128,185,0.08)' }}>
          <Box
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <TrendingUpOutlined sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Performance Overview
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: fontStack }}>
              {hasScores ? 'Assessment scores and performance metrics' : 'Assessment pending'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {hasScores ? (
            <>
              {/* Score Stat Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {scoreMetrics.map((m) => (
                  <Grid item xs={12} sm={6} md={3} key={m.label}>
                    <StatCard icon={m.icon} label={m.label} value={m.value} gradient={m.gradient} />
                  </Grid>
                ))}
              </Grid>

              {/* Score Progress Bars */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {scoreMetrics.map((m) => (
                  <Grid item xs={12} md={6} key={m.label}>
                    <Box
                      sx={{
                        p: 2.5, borderRadius: '12px',
                        border: '1px solid rgba(41,128,185,0.08)', bgcolor: '#fafbfc',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: '#f1f5f9', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(26,82,118,0.06)' },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                          {m.label} Score
                        </Typography>
                        <Chip
                          label={`${m.value}%`}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px',
                            fontFamily: fontStack, bgcolor: getScoreBg(m.value), color: getScoreColor(m.value),
                          }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={m.value}
                        sx={{
                          height: 8, borderRadius: 4, bgcolor: 'rgba(41,128,185,0.08)',
                          '& .MuiLinearProgress-bar': { borderRadius: 4, background: getScoreGradient(m.value) },
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Assessment Summary */}
              <Box
                sx={{
                  p: 2.5, borderRadius: '12px',
                  border: '1px solid rgba(41,128,185,0.08)', bgcolor: '#fafbfc',
                }}
              >
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack, mb: 2 }}>
                  Assessment Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', fontFamily: fontStack, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Overall Performance
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontFamily: fontStack, lineHeight: 1.6 }}>
                      {(interview.scores?.overall_score || interview.overallScore) >= 8
                        ? 'Excellent performance with strong capabilities across all areas.'
                        : (interview.scores?.overall_score || interview.overallScore) >= 6
                        ? 'Good performance with room for improvement in some areas.'
                        : (interview.scores?.overall_score || interview.overallScore) >= 4
                        ? 'Satisfactory performance but needs significant improvement.'
                        : 'Needs considerable improvement across multiple areas.'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', fontFamily: fontStack, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Recommendations
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontFamily: fontStack, lineHeight: 1.6 }}>
                      Focus on areas with lower scores. Consider additional practice sessions and targeted skill development.
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          ) : (
            <Box textAlign="center" py={4}>
              <DescriptionOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
                Interview Assessment Pending
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                This interview has not been scored yet. Scores will be available once the assessment is complete.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ViewMockInterview;