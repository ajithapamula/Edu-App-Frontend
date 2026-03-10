import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Skeleton,
  keyframes,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Person,
  Task,
  TrendingUp,
  ArrowBack,
  Refresh,
  ErrorOutline,
  Quiz
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import dailyStandupApiService from '../../../services/API/dailystandup';

/* ── inject fonts + keyframes ── */
const _s = document.getElementById('ds-view-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'ds-view-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes dsvFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
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
    <Box display="flex" alignItems="center" gap={2} mb={2.5}>
      <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
      <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
      <Box sx={{ flex: 1 }}><Skeleton variant="text" width={260} height={32} /><Skeleton variant="text" width={160} height={18} /></Box>
    </Box>
    <Box display="flex" gap={2} mb={2.5}>{[0,1,2,3].map(i => <Skeleton key={i} variant="rounded" sx={{ flex: 1, height: 80, borderRadius: '14px' }} />)}</Box>
    <Skeleton variant="rounded" width="100%" height={250} sx={{ borderRadius: '14px', mb: 2.5 }} />
    <Box display="flex" gap={2}>{[0,1].map(i => <Skeleton key={i} variant="rounded" sx={{ flex: 1, height: 180, borderRadius: '14px' }} />)}</Box>
  </Box>
);

const MentorViewDailyStandup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestData = async () => {
    try {
      setLoading(true); setError(null);
      console.log('Fetching test data for student ID:', id);
      const studentTests = await dailyStandupApiService.getStudentStandupTests(id);
      if (!studentTests || studentTests.length === 0) throw new Error('No test data found for this student');
      console.log('API Response - Test Data:', studentTests);
      setTestData(studentTests);
    } catch (err) {
      console.error('Error fetching test data:', err);
      setError(err.message || 'Failed to load test data');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchTestData(); }, [id]);

  const handleBack = () => { navigate('/mentor/daily-standups'); };
  const handleRetry = () => { fetchTestData(); };

  const getScoreColor = (score) => { if (score >= 8) return '#0d9488'; if (score >= 6) return '#0ea5e9'; if (score >= 4) return '#f59e0b'; return '#ef4444'; };
  const getScoreBg = (score) => { if (score >= 8) return '#f0fdf4'; if (score >= 6) return '#f0f4ff'; if (score >= 4) return '#fffbeb'; return '#fef2f2'; };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
          <IconButton onClick={handleBack} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff' } }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...hFont, fontSize: '1.3rem' }}>Test Data Details</Typography>
        </Box>
        <Alert severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}
          action={<Button color="inherit" size="small" onClick={handleRetry} startIcon={<Refresh />} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none' }}>Retry</Button>}>
          <Typography sx={{ ...hFont, fontSize: '0.95rem', mb: 0.5 }}>Failed to Load Test Data</Typography>
          <Typography sx={{ ...bFont, fontSize: '0.84rem' }}>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!testData || testData.length === 0) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
          <IconButton onClick={handleBack} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff' } }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...hFont, fontSize: '1.1rem', color: '#ef4444' }}>No test data found</Typography>
        </Box>
        <Alert severity="warning" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fde68a' }}>
          No test data found for Student ID: {id}
        </Alert>
      </Box>
    );
  }

  const testCount = testData.length;
  const studentName = testData[0]?.name || `Student ${id}`;
  const studentId = testData[0]?.Student_ID || id;
  const sessionId = testData[0]?.session_id;
  const averageScore = testData.reduce((sum, test) => sum + (test.score || 0), 0) / testCount;
  const maxScore = Math.max(...testData.map(t => t.score || 0));
  const minScore = Math.min(...testData.map(t => t.score || 0));

  const statCards = [
    { label: 'Student', value: studentName, sub: `ID: ${studentId}`, icon: <Person sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { label: 'Total Tests', value: testCount, icon: <Quiz sx={{ fontSize: 22 }} />, color: '#0ea5e9' },
    { label: 'Average Score', value: `${averageScore.toFixed(1)}/10`, icon: <TrendingUp sx={{ fontSize: 22 }} />, color: '#0d9488' },
    { label: 'Session ID', value: sessionId, icon: <Task sx={{ fontSize: 22 }} />, color: '#f59e0b' },
  ];

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, animation: 'dsvFadeUp 0.5s ease-out both', flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={handleBack} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <Task sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>Test Data — {studentName}</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.3}>
              <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b' }}>Daily Standup Tests</Typography>
              <Chip label={`Session ${sessionId}`} size="small" sx={{
                height: 22, fontSize: '0.68rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
              }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, animation: 'dsvFadeUp 0.5s ease-out 0.1s both' }}>
        {statCards.map((c, i) => (
          <Paper key={i} elevation={0} sx={{
            ...crd, p: 2.5, flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 0' }, minWidth: 0,
            transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 24px rgba(30,58,138,0.10)', transform: 'translateY(-2px)' },
          }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: `${c.color}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ ...hFont, fontSize: '1.15rem', lineHeight: 1.2, color: c.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</Typography>
                {c.sub ? (
                  <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8', mt: 0.1 }}>{c.sub}</Typography>
                ) : (
                  <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#64748b', mt: 0.1 }}>{c.label}</Typography>
                )}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Test Details Table */}
      <Paper elevation={0} sx={{ ...crd, overflow: 'hidden', mb: 2.5, animation: 'dsvFadeUp 0.5s ease-out 0.2s both' }}>
        <Box sx={{ p: 2.5, pb: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Quiz sx={{ color: '#0ea5e9', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: '1.02rem' }}>Test Details</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#94a3b8' }}>{testCount} test{testCount > 1 ? 's' : ''} recorded</Typography>
          </Box>
        </Box>
        <TableContainer sx={{ mt: 1.5 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Test ID', 'Student ID', 'Name', 'Session ID', 'Score'].map(h => (
                  <TableCell key={h} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.3,
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {testData.map((test, index) => {
                const color = getScoreColor(test.score);
                return (
                  <TableRow key={test.test_id || index} sx={{
                    transition: 'background 0.2s ease', '&:hover': { background: '#f8fafc' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                      <Typography sx={{ fontFamily: '"DM Sans", monospace', fontSize: '0.78rem', color: '#64748b' }}>{test.test_id}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                      <Typography sx={{ ...hFont, fontSize: '0.84rem', fontWeight: 600 }}>{test.Student_ID}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{
                          width: 28, height: 28, fontSize: '0.65rem',
                          fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                          background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
                        }}>
                          {test.name ? test.name.charAt(0) : 'S'}
                        </Avatar>
                        <Typography sx={{ ...bFont, fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{test.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                      <Chip label={test.session_id} size="small" sx={{
                        height: 24, fontSize: '0.7rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                        background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
                      }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                      <Chip label={`${test.score}/10`} size="small" sx={{
                        height: 24, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                        background: getScoreBg(test.score), color, border: `1px solid ${color}25`,
                      }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Bottom Cards */}
      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', md: 'row' }, animation: 'dsvFadeUp 0.5s ease-out 0.3s both' }}>
        {/* Score Analysis */}
        <Paper elevation={0} sx={{ ...crd, p: 3, flex: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp sx={{ color: '#0d9488', fontSize: 18 }} />
            </Box>
            <Typography sx={{ ...hFont, fontSize: '1.02rem' }}>Score Analysis</Typography>
          </Box>
          {[
            { label: 'Highest Score', value: `${maxScore}/10`, score: maxScore },
            { label: 'Lowest Score', value: `${minScore}/10`, score: minScore },
            { label: 'Average Score', value: `${averageScore.toFixed(1)}/10`, score: averageScore },
            { label: 'Score Range', value: minScore === maxScore ? `${minScore}/10` : `${minScore}–${maxScore}/10`, isText: true },
          ].map((row, i) => (
            <Box key={i} sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              py: 1.2, borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
            }}>
              <Typography sx={{ ...bFont, fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>{row.label}</Typography>
              {row.isText ? (
                <Typography sx={{ ...bFont, fontSize: '0.86rem', color: '#64748b' }}>{row.value}</Typography>
              ) : (
                <Chip label={row.value} size="small" sx={{
                  height: 24, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                  background: getScoreBg(row.score), color: getScoreColor(row.score), border: `1px solid ${getScoreColor(row.score)}25`,
                }} />
              )}
            </Box>
          ))}
        </Paper>

        {/* Test Information */}
        <Paper elevation={0} sx={{ ...crd, p: 3, flex: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Task sx={{ color: '#0ea5e9', fontSize: 18 }} />
            </Box>
            <Typography sx={{ ...hFont, fontSize: '1.02rem' }}>Test Information</Typography>
          </Box>
          {[
            { label: 'Student Name', value: studentName },
            { label: 'Student ID', value: studentId },
            { label: 'Session ID', value: sessionId },
            { label: 'Total Tests', value: testCount },
          ].map((row, i) => (
            <Box key={i} sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              py: 1.2, borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
            }}>
              <Typography sx={{ ...bFont, fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>{row.label}</Typography>
              <Typography sx={{ ...bFont, fontSize: '0.86rem', color: '#64748b' }}>{row.value}</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default MentorViewDailyStandup;