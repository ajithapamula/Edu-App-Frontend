import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Alert,
  Avatar,
  LinearProgress,
  Divider,
  Skeleton
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as AccessTimeIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import { mockTestsAPI } from '../../../services/API/mocktest.js';

/* ── inject fonts + keyframes ── */
const _s = document.getElementById('mt-view-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'mt-view-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes mtvFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const crd = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };

const MentorViewMockTest = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [studentTests, setStudentTests] = useState([]);
  const [studentStats, setStudentStats] = useState({ totalTests: 0, completedTests: 0, avgScore: 0, totalQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (studentId) fetchStudentDetails(); }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true); setError('');
      const studentData = await mockTestsAPI.getStudentById(studentId);
      setStudent(studentData);
      try {
        const testsResponse = await mockTestsAPI.getStudentTests(studentId);
        const testsData = testsResponse.tests || testsResponse || [];
        setStudentTests(testsData);
        setStudentStats(calculateStudentStats(testsData));
      } catch (testsError) {
        console.warn('Failed to fetch student tests:', testsError);
        setStudentTests([]);
        setStudentStats({ totalTests: 0, completedTests: 0, avgScore: 0, totalQuestions: 0 });
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      setError(`Failed to fetch student details: ${error.message}`);
    } finally { setLoading(false); }
  };

  const calculateStudentStats = (tests) => {
    if (!tests || tests.length === 0) return { totalTests: 0, completedTests: 0, avgScore: 0, totalQuestions: 0 };
    const completedTests = tests.filter(test => test.test_completed === true);
    const totalQuestions = tests.reduce((sum, test) => sum + (test.total_questions || 0), 0);
    const avgScore = completedTests.length > 0 ? (completedTests.reduce((sum, test) => sum + (test.score_percentage || 0), 0) / completedTests.length).toFixed(1) : 0;
    return { totalTests: tests.length, completedTests: completedTests.length, avgScore, totalQuestions };
  };

  const getStatusColor = (status) => { switch (status?.toLowerCase()) { case 'active': return 'success'; case 'inactive': return 'error'; default: return 'default'; } };
  const getTestStatusColor = (completed) => completed ? '#0d9488' : '#f59e0b';
  const getTestStatusBg = (completed) => completed ? '#f0fdf4' : '#fffbeb';
  const getTestStatusLabel = (completed) => completed ? 'Completed' : 'In Progress';
  const formatTimestamp = (timestamp) => { if (!timestamp) return 'N/A'; try { return new Date(timestamp * 1000).toLocaleString(); } catch (e) { return 'Invalid Date'; } };
  const getUserTypeLabel = (userType) => { switch (userType) { case 'dev': return 'Developer'; case 'non_dev': return 'Non-Developer'; default: return userType || 'Unknown'; } };
  const getUserTypeColor = (userType) => { switch (userType) { case 'dev': return '#1e3a8a'; case 'non_dev': return '#7c3aed'; default: return '#94a3b8'; } };
  const getUserTypeBg = (userType) => { switch (userType) { case 'dev': return '#f0f4ff'; case 'non_dev': return '#f5f3ff'; default: return '#f8fafc'; } };
  const getInitials = (name) => { if (!name || name === 'Unknown Student' || name === 'No Name') return '?'; return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); };
  const getScoreColor = (percentage) => { if (percentage >= 80) return '#0d9488'; if (percentage >= 60) return '#f59e0b'; return '#ef4444'; };

  if (loading) return <LoadingSpinner />;

  if (error || !student) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff' } }}>
            <ArrowBackIcon sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...hFont, fontSize: '1.3rem' }}>Student Profile</Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}>{error || 'Student not found.'}</Alert>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} variant="contained" disableElevation sx={{
          background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 600, textTransform: 'none', borderRadius: '10px', boxShadow: '0 4px 14px rgba(14,165,233,0.25)',
          '&:hover': { background: 'linear-gradient(135deg, #0284c7, #0d9488)' },
        }}>Go Back</Button>
      </Box>
    );
  }

  const statCards = [
    { label: 'Total Tests', value: studentStats.totalTests, icon: <AssignmentIcon sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { label: 'Completed', value: studentStats.completedTests, icon: <CheckCircleIcon sx={{ fontSize: 22 }} />, color: '#0d9488' },
    { label: 'Avg Score', value: `${studentStats.avgScore}%`, icon: <TrendingUpIcon sx={{ fontSize: 22 }} />, color: '#0ea5e9' },
    { label: 'Total Questions', value: studentStats.totalQuestions, icon: <QuestionAnswerIcon sx={{ fontSize: 22 }} />, color: '#f59e0b' },
  ];

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, animation: 'mtvFadeUp 0.5s ease-out both', flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
            <ArrowBackIcon sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <PersonIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>Student Profile</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>{student.name || 'Unknown Student'}</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          {[{ icon: <DownloadIcon sx={{ fontSize: 18 }} />, title: 'Download Report' }, { icon: <PrintIcon sx={{ fontSize: 18 }} />, title: 'Print Details' }].map((a, i) => (
            <Tooltip key={i} title={a.title} arrow>
              <IconButton sx={{ width: 36, height: 36, borderRadius: '9px', background: '#fff', border: '1px solid #e8ecf2', color: '#475569', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
                {a.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Student Info + Stats */}
      <Paper elevation={0} sx={{ ...crd, p: 3, mb: 2.5, animation: 'mtvFadeUp 0.5s ease-out 0.1s both' }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' } }}>
          {/* Avatar & Info */}
          <Box display="flex" alignItems="center" gap={2.5} sx={{ flex: '0 0 auto' }}>
            <Avatar sx={{
              width: 68, height: 68, fontSize: '1.4rem',
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800,
              background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
              boxShadow: '0 6px 20px rgba(14,165,233,0.25)',
            }}>
              {getInitials(student.name)}
            </Avatar>
            <Box>
              <Typography sx={{ ...hFont, fontSize: '1.25rem' }}>{student.name || 'Unknown Student'}</Typography>
              <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b', mb: 0.8 }}>Student ID: {student.Student_ID}</Typography>
              <Chip label={student.name ? 'Active' : 'Inactive'} size="small" color={getStatusColor(student.name ? 'active' : 'inactive')} sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '0.7rem',
              }} />
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: '#f1f5f9' }} />
          <Divider sx={{ display: { xs: 'block', md: 'none' }, borderColor: '#f1f5f9', width: '100%' }} />

          {/* Stat Cards inline */}
          <Box sx={{ flex: 1, display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
            {statCards.map((c, i) => (
              <Box key={i} sx={{
                flex: '1 1 calc(25% - 12px)', minWidth: 130, p: 2, borderRadius: '12px',
                background: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center',
                transition: 'all 0.3s ease', '&:hover': { borderColor: '#dbeafe', background: '#f0f4ff', transform: 'translateY(-2px)' },
              }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '9px', mx: 'auto', mb: 1, background: `${c.color}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</Box>
                <Typography sx={{ ...hFont, fontSize: '1.3rem', lineHeight: 1, color: c.color }}>{c.value}</Typography>
                <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#94a3b8', mt: 0.3 }}>{c.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Test History */}
      <Paper elevation={0} sx={{ ...crd, overflow: 'hidden', animation: 'mtvFadeUp 0.5s ease-out 0.2s both' }}>
        <Box sx={{ p: 2.5, pb: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SchoolIcon sx={{ color: '#0ea5e9', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: '1.05rem' }}>Test History</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#94a3b8' }}>{studentTests.length} test{studentTests.length !== 1 ? 's' : ''} assigned</Typography>
          </Box>
        </Box>

        <TableContainer sx={{ mt: 1.5 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Test ID', 'Session ID', 'User Type', 'Questions', 'Final Score', 'Score %', 'Status', 'Test Date', 'Progress'].map(h => (
                  <TableCell key={h} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.7rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.3,
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {studentTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ borderBottom: 'none', py: 5 }}>
                    <Box textAlign="center">
                      <Box sx={{ width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 1.5, background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AssignmentIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ ...hFont, fontSize: '1rem', mb: 0.5 }}>No Tests Found</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>No tests found for this student</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                studentTests.map((test, index) => {
                  const scoreColor = getScoreColor(test.score_percentage || 0);
                  return (
                    <TableRow key={test.test_id || index} sx={{
                      transition: 'background 0.2s ease',
                      '&:hover': { background: '#f8fafc' },
                      '&:last-child td': { borderBottom: 'none' },
                    }}>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Typography sx={{ ...hFont, fontSize: '0.78rem', fontWeight: 600, color: '#0ea5e9' }}>
                          {test.test_id ? test.test_id.split('-')[0] : 'N/A'}...
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Chip label={test.session_id || 'N/A'} size="small" sx={{
                          height: 22, fontSize: '0.68rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                          background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
                        }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Chip label={getUserTypeLabel(test.user_type)} size="small" sx={{
                          height: 22, fontSize: '0.68rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                          background: getUserTypeBg(test.user_type), color: getUserTypeColor(test.user_type),
                          border: `1px solid ${getUserTypeColor(test.user_type)}20`,
                        }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <QuestionAnswerIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                          <Typography sx={{ ...hFont, fontSize: '0.82rem', fontWeight: 600 }}>{test.total_questions || 0}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Typography sx={{ ...hFont, fontSize: '0.82rem', fontWeight: 700, color: scoreColor }}>{test.final_score || 0}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography sx={{ ...hFont, fontSize: '0.82rem', fontWeight: 700, color: scoreColor }}>{test.score_percentage || 0}%</Typography>
                          <GradeIcon sx={{ fontSize: 14, color: scoreColor }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Chip label={getTestStatusLabel(test.test_completed)} size="small" sx={{
                          height: 22, fontSize: '0.66rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                          background: getTestStatusBg(test.test_completed), color: getTestStatusColor(test.test_completed),
                          border: `1px solid ${getTestStatusColor(test.test_completed)}25`,
                        }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#64748b' }}>{formatTimestamp(test.timestamp)}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1} sx={{ width: 100 }}>
                          <LinearProgress variant="determinate" value={test.test_completed ? 100 : 50} sx={{
                            flex: 1, height: 5, borderRadius: 3, backgroundColor: '#e8ecf2',
                            '& .MuiLinearProgress-bar': { borderRadius: 3, background: test.test_completed ? 'linear-gradient(90deg, #0d9488, #0d948890)' : 'linear-gradient(90deg, #f59e0b, #f59e0b90)' },
                          }} />
                          <Typography sx={{ ...hFont, fontSize: '0.7rem', fontWeight: 700, color: test.test_completed ? '#0d9488' : '#f59e0b', minWidth: 28 }}>
                            {test.test_completed ? '100%' : '50%'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default MentorViewMockTest;