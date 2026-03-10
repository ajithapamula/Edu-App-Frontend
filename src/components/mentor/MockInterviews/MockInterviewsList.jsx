import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  TextField,
  Alert,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  keyframes,
  Container,
  CircularProgress,
  alpha,
  styled,
  useTheme,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  Remove,
  Schedule,
  Analytics,
  People,
  Assessment,
  Refresh
} from '@mui/icons-material';
import { weeklyInterviewsAPI } from '../../../services/API/mockinterviews';

/* ── inject fonts + keyframes ── */
const _s = document.getElementById('mi-list-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'mi-list-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes miFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes miSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const crd = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', background: '#f8fafc',
    '& fieldset': { borderColor: '#e8ecf2' }, '&:hover fieldset': { borderColor: '#bfdbfe' },
    '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
  },
};

/* Skeleton */
const PageSkeleton = () => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" alignItems="center" gap={2} mb={2.5}>
      <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
      <Box><Skeleton variant="text" width={280} height={32} /><Skeleton variant="text" width={200} height={18} /></Box>
    </Box>
    <Box display="flex" gap={2} mb={2.5}>{[0,1,2,3].map(i => <Skeleton key={i} variant="rounded" sx={{ flex: 1, height: 80, borderRadius: '14px' }} />)}</Box>
    <Skeleton variant="rounded" width="100%" height={50} sx={{ borderRadius: '14px', mb: 2.5 }} />
    <Skeleton variant="rounded" width="100%" height={300} sx={{ borderRadius: '14px' }} />
  </Box>
);

const MentorMockInterviewSystem = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0, withScores: 0, averageOverallScore: 0, averageTechnicalScore: 0,
    averageCommunicationScore: 0, averageHrScore: 0
  });

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
      setError(null);
      const data = await weeklyInterviewsAPI.getAllInterviews();
      const transformed = data.map(weeklyInterviewsAPI.transformInterviewData);
      setInterviews(transformed);
      const statsData = await weeklyInterviewsAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      setError(error.message); setInterviews([]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { fetchData(true); };
  const handleSearch = (event) => { setSearchTerm(event.target.value); };
  const handleView = (interview) => {
    const interviewId = interview.testId || interview.id;
    navigate(`/mentor/mock-interviews/view/${interviewId}`);
  };

  const getScoreColor = (score) => { if (score >= 8) return '#0d9488'; if (score >= 6) return '#f59e0b'; if (score >= 4) return '#0ea5e9'; return '#ef4444'; };
  const getScoreBg = (score) => { if (score >= 8) return '#f0fdf4'; if (score >= 6) return '#fffbeb'; if (score >= 4) return '#f0f4ff'; return '#fef2f2'; };
  const getScoreIcon = (score) => {
    if (score >= 8) return <TrendingUp sx={{ fontSize: 16, color: '#0d9488' }} />;
    if (score >= 6) return <Remove sx={{ fontSize: 16, color: '#f59e0b' }} />;
    return <TrendingDown sx={{ fontSize: 16, color: '#ef4444' }} />;
  };

  const filteredInterviews = interviews.filter(interview => {
    return interview.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           interview.testId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           interview.studentId.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: 'N/A', time: 'N/A' };
    let date;
    if (typeof timestamp === 'number') { date = new Date(timestamp * 1000); } else { date = new Date(timestamp); }
    if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const statCards = [
    { label: 'Total Interviews', value: stats.total, icon: <People sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { label: 'Assessed', value: stats.withScores, icon: <Assessment sx={{ fontSize: 22 }} />, color: '#0d9488' },
    { label: 'Avg Overall Score', value: stats.averageOverallScore, icon: <Star sx={{ fontSize: 22 }} />, color: '#0ea5e9' },
    { label: 'Avg Technical Score', value: stats.averageTechnicalScore, icon: <Analytics sx={{ fontSize: 22 }} />, color: '#f59e0b' },
  ];

  if (loading) return <PageSkeleton />;

  if (error && !loading && !refreshing) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, md: 3 }, boxSizing: 'border-box' }}>
        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <Assessment sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography sx={{ ...hFont, fontSize: '1.45rem' }}>Weekly Interviews Management</Typography>
        </Box>
        <Alert severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}
          action={<IconButton size="small" onClick={handleRefresh}><Refresh sx={{ fontSize: 20 }} /></IconButton>}>
          Failed to load interview data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, animation: 'miFadeUp 0.5s ease-out both' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <Assessment sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>Weekly Interviews Management</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>Monitor and review student interview assessments</Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh Data" arrow>
          <IconButton onClick={handleRefresh} disabled={loading || refreshing} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease',
          }}>
            <Refresh sx={{ fontSize: 20, color: '#475569', animation: refreshing ? 'miSpin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, animation: 'miFadeUp 0.5s ease-out 0.1s both' }}>
        {statCards.map((c, i) => (
          <Paper key={i} elevation={0} sx={{
            ...crd, p: 2.5, flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 0' }, minWidth: 0,
            transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 24px rgba(30,58,138,0.10)', transform: 'translateY(-2px)' },
          }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: `${c.color}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</Box>
              <Box>
                <Typography sx={{ ...hFont, fontSize: '1.35rem', lineHeight: 1.2, color: c.color }}>{c.value}</Typography>
                <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#64748b', mt: 0.1 }}>{c.label}</Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Search */}
      <Paper elevation={0} sx={{ ...crd, p: 2.5, mb: 2.5, animation: 'miFadeUp 0.5s ease-out 0.15s both' }}>
        <TextField fullWidth size="small" placeholder="Search by student name, student ID, or test ID..." value={searchTerm} onChange={handleSearch}
          sx={{ ...inputSx, maxWidth: 460 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment> }}
        />
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ ...crd, overflow: 'hidden', animation: 'miFadeUp 0.5s ease-out 0.2s both' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Student', 'Test ID', 'Session', 'Date & Time', 'Overall Score', 'Technical', 'Communication', 'Actions'].map(h => (
                  <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.5,
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInterviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ borderBottom: 'none', py: 5 }}>
                    <Box textAlign="center">
                      <Box sx={{ width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 1.5, background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Assessment sx={{ color: '#0ea5e9', fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ ...hFont, fontSize: '1rem', mb: 0.5 }}>No Interviews Found</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>
                        {searchTerm ? 'Try adjusting your search criteria.' : 'No interview data is available at the moment.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInterviews.map((interview, index) => {
                  const dateTime = formatTimestamp(interview.timestamp);
                  return (
                    <TableRow key={interview.id} onClick={() => handleView(interview)} sx={{
                      cursor: 'pointer', transition: 'background 0.2s ease',
                      '&:hover': { background: '#f8fafc' }, '&:last-child td': { borderBottom: 'none' },
                    }}>
                      {/* Student */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{
                            width: 36, height: 36, fontSize: '0.78rem',
                            fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
                            boxShadow: '0 2px 8px rgba(14,165,233,0.20)',
                          }}>
                            {interview.studentName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ ...hFont, fontSize: '0.85rem', fontWeight: 600 }}>{interview.studentName}</Typography>
                            <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8' }}>ID: {interview.studentId}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      {/* Test ID */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Typography sx={{
                          fontFamily: '"DM Sans", monospace', fontSize: '0.72rem', color: '#64748b',
                          background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px',
                          px: 1, py: 0.4, display: 'inline-block',
                        }}>{interview.testId}</Typography>
                      </TableCell>
                      {/* Session */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Chip label={`Session ${interview.sessionId}`} size="small" sx={{
                          height: 24, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                          background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
                        }} />
                      </TableCell>
                      {/* Date & Time */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Typography sx={{ ...hFont, fontSize: '0.82rem', fontWeight: 600 }}>{dateTime.date}</Typography>
                        <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8' }}>{dateTime.time}</Typography>
                      </TableCell>
                      {/* Overall Score */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        {interview.overallScore !== null ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {getScoreIcon(interview.overallScore)}
                            <Chip label={interview.overallScore} size="small" sx={{
                              height: 24, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                              background: getScoreBg(interview.overallScore), color: getScoreColor(interview.overallScore),
                              border: `1px solid ${getScoreColor(interview.overallScore)}25`,
                            }} />
                          </Box>
                        ) : (
                          <Typography sx={{ ...bFont, fontSize: '0.8rem', color: '#94a3b8' }}>Not scored</Typography>
                        )}
                      </TableCell>
                      {/* Technical */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        {interview.technicalScore !== null ? (
                          <Chip label={interview.technicalScore} size="small" sx={{
                            height: 24, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                            background: getScoreBg(interview.technicalScore), color: getScoreColor(interview.technicalScore),
                            border: `1px solid ${getScoreColor(interview.technicalScore)}25`,
                          }} />
                        ) : (
                          <Typography sx={{ ...bFont, fontSize: '0.8rem', color: '#94a3b8' }}>Not scored</Typography>
                        )}
                      </TableCell>
                      {/* Communication */}
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        {interview.communicationScore !== null ? (
                          <Chip label={interview.communicationScore} size="small" sx={{
                            height: 24, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                            background: getScoreBg(interview.communicationScore), color: getScoreColor(interview.communicationScore),
                            border: `1px solid ${getScoreColor(interview.communicationScore)}25`,
                          }} />
                        ) : (
                          <Typography sx={{ ...bFont, fontSize: '0.8rem', color: '#94a3b8' }}>Not scored</Typography>
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                        <Tooltip title="View Details" arrow>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleView(interview); }} sx={{
                            width: 32, height: 32, borderRadius: '8px', color: '#0ea5e9',
                            background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)',
                            transition: 'all 0.25s ease',
                            '&:hover': { background: 'rgba(14,165,233,0.12)', borderColor: 'rgba(14,165,233,0.25)', transform: 'translateY(-1px)' },
                          }}>
                            <Visibility sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Refreshing overlay */}
      {refreshing && (
        <Box position="fixed" top={0} left={0} right={0} bottom={0}
          bgcolor="rgba(241,245,249,0.7)" display="flex" alignItems="center" justifyContent="center" zIndex={9999}
          sx={{ backdropFilter: 'blur(4px)' }}>
          <Paper elevation={0} sx={{ ...crd, p: 3, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 8px 32px rgba(30,58,138,0.12)' }}>
            <CircularProgress size={22} sx={{ color: '#0ea5e9' }} />
            <Typography sx={{ ...bFont, fontSize: '0.88rem' }}>Refreshing data...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default MentorMockInterviewSystem;