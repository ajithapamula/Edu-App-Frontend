import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Alert,
  Button,
  Skeleton,
  keyframes,
  Container,
  Stack,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Person,
  Schedule,
  Star,
  ArrowBack,
  Assessment,
  Badge as BadgeIcon,
  TrendingUp,
  Analytics,
  Timer,
  CalendarToday,
  Download,
  Share,
  Print,
  MoreVert,
  Refresh,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { weeklyInterviewsAPI } from '../../../services/API/mockinterviews';

/* ── inject fonts + keyframes ── */
const _s = document.getElementById('mi-view-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'mi-view-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes mivFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const crd = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };

/* Skeleton */
const PageSkeleton = () => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
      <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
      <Box sx={{ flex: 1 }}><Skeleton variant="text" width={280} height={32} /><Skeleton variant="text" width={180} height={18} /></Box>
    </Box>
    <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: '14px', mb: 2.5 }} />
    <Skeleton variant="rounded" width="100%" height={130} sx={{ borderRadius: '14px', mb: 2.5 }} />
    <Skeleton variant="rounded" width="100%" height={250} sx={{ borderRadius: '14px' }} />
  </Box>
);

const MentorViewMockInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      setLoading(true); setError(null);
      try {
        const allInterviews = await weeklyInterviewsAPI.getAllInterviews();
        const foundInterview = allInterviews.find(
          interview => interview.test_id === id || interview.id === id || interview.Student_ID === id || interview.student_id === id
        );
        if (foundInterview) { setInterview(weeklyInterviewsAPI.transformInterviewData(foundInterview)); }
        else { setError('Interview not found'); }
      } catch (error) { console.error('Failed to load interview:', error); setError('Failed to load interview data: ' + error.message); }
      finally { setLoading(false); }
    };
    if (id) fetchInterview();
  }, [id]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const allInterviews = await weeklyInterviewsAPI.getAllInterviews();
      const foundInterview = allInterviews.find(
        interview => interview.test_id === id || interview.id === id || interview.Student_ID === id || interview.student_id === id
      );
      if (foundInterview) { setInterview(weeklyInterviewsAPI.transformInterviewData(foundInterview)); setError(null); }
    } catch (error) { setError('Failed to refresh interview data'); }
    finally { setLoading(false); }
  };

  const getScoreColor = (score) => { if (score >= 8) return '#0d9488'; if (score >= 6) return '#f59e0b'; if (score >= 4) return '#0ea5e9'; return '#ef4444'; };
  const getScoreBg = (score) => { if (score >= 8) return '#f0fdf4'; if (score >= 6) return '#fffbeb'; if (score >= 4) return '#f0f4ff'; return '#fef2f2'; };
  const getScorePercentage = (score) => `${score}%`;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: 'N/A', time: 'N/A' };
    let date;
    if (typeof timestamp === 'number') { date = new Date(timestamp * 1000); } else { date = new Date(timestamp); }
    if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const getInitials = (name) => {
    if (!name || name === 'Unknown Student' || name === 'No Name') return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return <PageSkeleton />;

  if (error || !interview) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/mentor/mock-interviews')} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff' } }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...hFont, fontSize: '1.3rem' }}>Interview Assessment</Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}>
          {error || 'Interview not found or you don\'t have permission to view it.'}
        </Alert>
        <Button onClick={() => navigate('/mentor/mock-interviews')} startIcon={<ArrowBack />} variant="contained" disableElevation sx={{
          background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 600, textTransform: 'none', borderRadius: '10px', boxShadow: '0 4px 14px rgba(14,165,233,0.25)',
          '&:hover': { background: 'linear-gradient(135deg, #0284c7, #0d9488)' },
        }}>Back to List</Button>
      </Box>
    );
  }

  const dateTime = formatTimestamp(interview.timestamp);
  const studentName = interview.studentName || interview.student_name || interview.name || 'Unknown Student';
  const hasScores = interview.overallScore !== null || interview.technicalScore !== null ||
    interview.communicationScore !== null || interview.hrScore !== null ||
    interview.scores?.overall_score !== null || interview.scores?.technical_score !== null ||
    interview.scores?.communication_score !== null || interview.scores?.hr_score !== null;

  const scoreCards = [
    { label: 'Overall', value: interview.scores?.overall_score || interview.overallScore, icon: <Star sx={{ fontSize: 22 }} />, accent: '#1e3a8a' },
    { label: 'Technical', value: interview.scores?.technical_score || interview.technicalScore, icon: <Analytics sx={{ fontSize: 22 }} />, accent: '#0ea5e9' },
    { label: 'Communication', value: interview.scores?.communication_score || interview.communicationScore, icon: <QuestionAnswerIcon sx={{ fontSize: 22 }} />, accent: '#0d9488' },
    { label: 'HR Skills', value: interview.scores?.hr_score || interview.hrScore, icon: <Person sx={{ fontSize: 22 }} />, accent: '#f59e0b' },
  ].filter(c => c.value !== null && c.value !== undefined);

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, animation: 'mivFadeUp 0.5s ease-out both', flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/mentor/mock-interviews')} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <Assessment sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>Interview Assessment</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>{studentName}</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          {[{ icon: <Refresh sx={{ fontSize: 18 }} />, title: 'Refresh', onClick: handleRefresh }, { icon: <Download sx={{ fontSize: 18 }} />, title: 'Download Report' }, { icon: <Print sx={{ fontSize: 18 }} />, title: 'Print Details' }].map((a, i) => (
            <Tooltip key={i} title={a.title} arrow>
              <IconButton onClick={a.onClick || undefined} sx={{ width: 36, height: 36, borderRadius: '9px', background: '#fff', border: '1px solid #e8ecf2', color: '#475569', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
                {a.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Student Info Card */}
      <Paper elevation={0} sx={{ ...crd, p: 3, mb: 2.5, animation: 'mivFadeUp 0.5s ease-out 0.1s both' }}>
        <Box display="flex" alignItems="center" gap={2.5} flexWrap="wrap">
          <Avatar sx={{
            width: 64, height: 64, fontSize: '1.3rem',
            fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800,
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            boxShadow: '0 6px 20px rgba(14,165,233,0.25)',
          }}>{getInitials(studentName)}</Avatar>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography sx={{ ...hFont, fontSize: '1.2rem', mb: 0.3 }}>{studentName}</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mb: 1 }}>Student ID: {interview.studentId || interview.Student_ID || 'N/A'}</Typography>
            <Box display="flex" gap={0.8} flexWrap="wrap">
              <Chip label="Weekly Interview" size="small" sx={{ height: 24, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe' }} />
              <Chip label={`Session ${interview.sessionId || interview.session_id || 'N/A'}`} size="small" sx={{ height: 24, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, background: '#f8fafc', color: '#64748b', border: '1px solid #e8ecf2' }} />
              {hasScores && <Chip label="Assessed" size="small" sx={{ height: 24, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, background: '#f0fdf4', color: '#0d9488', border: '1px solid #0d948825' }} />}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Interview Details Table */}
      <Paper elevation={0} sx={{ ...crd, overflow: 'hidden', mb: 2.5, animation: 'mivFadeUp 0.5s ease-out 0.15s both' }}>
        <Box sx={{ p: 2.5, pb: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Assessment sx={{ color: '#0ea5e9', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: '1.02rem' }}>Interview Details</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#94a3b8' }}>Basic interview information</Typography>
          </Box>
        </Box>
        <TableContainer sx={{ mt: 1.5 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Test ID', 'Session ID', 'Test Date', 'Test Time', 'Status'].map(h => (
                  <TableCell key={h} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.3,
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{ '&:hover': { background: '#f8fafc' } }}>
                <TableCell sx={{ borderBottom: 'none', py: 1.8 }}>
                  <Typography sx={{ fontFamily: '"DM Sans", monospace', fontSize: '0.78rem', color: '#0ea5e9', fontWeight: 600 }}>
                    {interview.testId || interview.test_id ? `${(interview.testId || interview.test_id).substring(0, 8)}...` : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1.8 }}>
                  <Chip label={interview.sessionId || interview.session_id || 'N/A'} size="small" sx={{ height: 24, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe' }} />
                </TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1.8 }}>
                  <Typography sx={{ ...hFont, fontSize: '0.85rem', fontWeight: 600 }}>{dateTime.date}</Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1.8 }}>
                  <Typography sx={{ ...bFont, fontSize: '0.85rem' }}>{dateTime.time}</Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: 'none', py: 1.8 }}>
                  <Chip label={hasScores ? 'Completed' : 'Pending'} size="small" sx={{
                    height: 24, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    background: hasScores ? '#f0fdf4' : '#fffbeb', color: hasScores ? '#0d9488' : '#f59e0b',
                    border: `1px solid ${hasScores ? '#0d948825' : '#f59e0b25'}`,
                  }} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Performance Overview */}
      <Paper elevation={0} sx={{ ...crd, p: 3, animation: 'mivFadeUp 0.5s ease-out 0.2s both' }}>
        <Box display="flex" alignItems="center" gap={1} mb={2.5}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp sx={{ color: '#0d9488', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: '1.05rem' }}>Performance Overview</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#94a3b8' }}>{hasScores ? 'Assessment scores and metrics' : 'Assessment pending'}</Typography>
          </Box>
        </Box>

        {hasScores ? (
          <>
            {/* Score Cards */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {scoreCards.map((c, i) => {
                const color = getScoreColor(c.value);
                const bg = getScoreBg(c.value);
                return (
                  <Box key={i} sx={{
                    flex: '1 1 calc(25% - 12px)', minWidth: 160, p: 2.5, borderRadius: '12px',
                    background: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': { borderColor: '#dbeafe', background: '#f0f4ff', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(30,58,138,0.08)' },
                  }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', mx: 'auto', mb: 1.5, background: `${c.accent}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent }}>
                      {c.icon}
                    </Box>
                    <Typography sx={{ ...hFont, fontSize: '1.8rem', lineHeight: 1, color, mb: 0.5 }}>{c.value}</Typography>
                    <Typography sx={{ ...bFont, fontSize: '0.84rem', fontWeight: 500, mb: 1.5 }}>{c.label}</Typography>
                    <Chip label={getScorePercentage(c.value)} size="small" sx={{
                      height: 22, fontSize: '0.68rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                      background: bg, color, border: `1px solid ${color}25`, mb: 1.5,
                    }} />
                    <LinearProgress variant="determinate" value={c.value} sx={{
                      height: 5, borderRadius: 3, backgroundColor: '#e8ecf2',
                      '& .MuiLinearProgress-bar': { borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}90)` },
                    }} />
                  </Box>
                );
              })}
            </Box>

            {/* Assessment Summary */}
            <Box sx={{ p: 2.5, borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <Typography sx={{ ...hFont, fontSize: '0.95rem', mb: 2 }}>Assessment Summary</Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Overall Performance</Typography>
                  <Typography sx={{ ...bFont, fontSize: '0.86rem', lineHeight: 1.6 }}>
                    {(interview.scores?.overall_score || interview.overallScore) >= 8 ? 'Excellent performance with strong capabilities across all areas.' :
                     (interview.scores?.overall_score || interview.overallScore) >= 6 ? 'Good performance with room for improvement in some areas.' :
                     (interview.scores?.overall_score || interview.overallScore) >= 4 ? 'Satisfactory performance but needs significant improvement.' :
                     'Needs considerable improvement across multiple areas.'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: '#e8ecf2', display: { xs: 'none', md: 'block' } }} />
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Recommendations</Typography>
                  <Typography sx={{ ...bFont, fontSize: '0.86rem', lineHeight: 1.6 }}>
                    Focus on areas with lower scores. Consider additional practice sessions and targeted skill development.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <Box sx={{ width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 1.5, background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AssignmentIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />
            </Box>
            <Typography sx={{ ...hFont, fontSize: '1rem', mb: 0.5 }}>Assessment Pending</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>
              This interview has not been scored yet. Scores will be available once the assessment is complete.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MentorViewMockInterview;