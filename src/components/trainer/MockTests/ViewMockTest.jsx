import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Avatar,
  LinearProgress,
  Chip,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  PersonOutlined,
  ArrowBack as ArrowBackIcon,
  AccessTime as AccessTimeIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Grade as GradeIcon,
  AssignmentOutlined,
  SchoolOutlined,
  CheckCircle as CheckCircleIcon,
  TrendingUpOutlined,
  Download as DownloadIcon,
  Print as PrintIcon,
  DescriptionOutlined,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

import { mockTestsAPI } from '../../../services/API/mocktest.js';

const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* ——— Stat Card ——— */
const StatCard = ({ icon, label, value, gradient }) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: '14px',
      bgcolor: '#fff',
      border: '1px solid rgba(41,128,185,0.08)',
      boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'all 0.2s ease',
      '&:hover': { boxShadow: '0 4px 16px rgba(26,82,118,0.08)', transform: 'translateY(-1px)' },
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: '11px',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
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
const ViewMockTestShimmer = () => (
  <Box>
    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
      <Skeleton variant="circular" width={34} height={34} />
      <Skeleton variant="text" width={200} height={36} />
    </Box>
    <Box sx={{ p: 3, mb: 3, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Skeleton variant="circular" width={64} height={64} />
        <Box>
          <Skeleton variant="text" width={200} height={30} />
          <Skeleton variant="text" width={140} height={20} />
          <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: '6px', mt: 0.5 }} />
        </Box>
      </Box>
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '14px' }} />
          </Grid>
        ))}
      </Grid>
    </Box>
    <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Table>
        <TableHead>
          <TableRow>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <TableCell key={i}><Skeleton variant="text" width={60 + i * 8} /></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[0, 1, 2].map((i) => (
            <TableRow key={i}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                <TableCell key={j}><Skeleton variant="text" width={50 + j * 6} /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  </Box>
);

const ViewMockTest = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [studentTests, setStudentTests] = useState([]);
  const [studentStats, setStudentStats] = useState({
    totalTests: 0, completedTests: 0, avgScore: 0, totalQuestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentId) fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError('');

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
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(`Failed to fetch student details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentStats = (tests) => {
    if (!tests || tests.length === 0) return { totalTests: 0, completedTests: 0, avgScore: 0, totalQuestions: 0 };
    const completed = tests.filter((t) => t.test_completed === true);
    const totalQ = tests.reduce((s, t) => s + (t.total_questions || 0), 0);
    const avg = completed.length > 0
      ? (completed.reduce((s, t) => s + (t.score_percentage || 0), 0) / completed.length).toFixed(1)
      : 0;
    return { totalTests: tests.length, completedTests: completed.length, avgScore: avg, totalQuestions: totalQ };
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    try { return new Date(ts * 1000).toLocaleString(); } catch { return 'Invalid Date'; }
  };

  const getUserTypeLabel = (t) => {
    switch (t) { case 'dev': return 'Developer'; case 'non_dev': return 'Non-Developer'; default: return t || 'Unknown'; }
  };

  const getUserTypeColor = (t) => {
    switch (t) { case 'dev': return { bg: 'rgba(41,128,185,0.10)', color: '#1a5276' }; case 'non_dev': return { bg: 'rgba(124,58,237,0.10)', color: '#7c3aed' }; default: return { bg: 'rgba(148,163,184,0.15)', color: '#64748b' }; }
  };

  const getInitials = (name) => {
    if (!name || name === 'Unknown Student' || name === 'No Name') return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getScoreColor = (pct) => {
    if (pct >= 80) return '#0d9488';
    if (pct >= 60) return '#d97706';
    return '#dc2626';
  };

  if (loading) return <ViewMockTestShimmer />;

  if (error || !student) {
    return (
      <Box>
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: '12px', boxShadow: '0 4px 16px rgba(239,68,68,0.10)' }}
        >
          {error || 'Student not found.'}
        </Alert>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon sx={{ fontSize: '18px !important' }} />}
          variant="outlined"
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
            borderRadius: '10px', borderColor: 'rgba(41,128,185,0.20)',
            color: '#2980b9', px: 2.5, fontFamily: fontStack,
            '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
          }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(41,128,185,0.12)' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: '11px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <PersonOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Student Profile
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Download Report">
            <IconButton
              sx={{
                width: 34, height: 34, borderRadius: '9px',
                color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' },
              }}
            >
              <DownloadIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Details">
            <IconButton
              sx={{
                width: 34, height: 34, borderRadius: '9px',
                color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' },
              }}
            >
              <PrintIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Student Information Card */}
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
            {getInitials(student.name)}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack, mb: 0.3 }}>
              {student.name || 'Unknown Student'}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack, mb: 0.8 }}>
              Student ID: {student.Student_ID}
            </Typography>
            <Chip
              label={student.name ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', fontFamily: fontStack,
                bgcolor: student.name ? 'rgba(13,148,136,0.10)' : 'rgba(239,68,68,0.10)',
                color: student.name ? '#0d9488' : '#dc2626',
              }}
            />
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'rgba(41,128,185,0.08)', mb: 3 }} />

        {/* Statistics Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<AssignmentOutlined sx={{ color: '#fff', fontSize: 20 }} />}
              label="Total Tests"
              value={studentStats.totalTests}
              gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<CheckCircleIcon sx={{ color: '#fff', fontSize: 20 }} />}
              label="Completed"
              value={studentStats.completedTests}
              gradient="linear-gradient(135deg, #dc2626 0%, #f87171 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TrendingUpOutlined sx={{ color: '#fff', fontSize: 20 }} />}
              label="Avg Score"
              value={`${studentStats.avgScore}%`}
              gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<QuestionAnswerIcon sx={{ color: '#fff', fontSize: 20 }} />}
              label="Total Questions"
              value={studentStats.totalQuestions}
              gradient="linear-gradient(135deg, #d97706 0%, #fbbf24 100%)"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Test History */}
      <Box
        sx={{
          borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
        }}
      >
        {/* Table Header */}
        <Box
          sx={{
            p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: '1px solid rgba(41,128,185,0.08)',
          }}
        >
          <Box
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <SchoolOutlined sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Test History
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: fontStack }}>
              {studentTests.length} test{studentTests.length !== 1 ? 's' : ''} assigned to this student
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(41,128,185,0.04)' }}>
                {['Test ID', 'Session ID', 'User Type', 'Questions', 'Final Score', 'Score %', 'Status', 'Test Date', 'Progress'].map((h) => (
                  <TableCell key={h}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {studentTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <DescriptionOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
                      No Tests Found
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      No tests have been assigned to this student yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                studentTests.map((test, index) => {
                  const utColor = getUserTypeColor(test.user_type);
                  return (
                    <TableRow
                      key={test.test_id || index}
                      hover
                      sx={{
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' },
                        '&:last-child td': { borderBottom: 0 },
                        borderBottom: '1px solid rgba(41,128,185,0.06)',
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a5276', fontFamily: fontStack }}>
                          {test.test_id ? test.test_id.split('-')[0] : 'N/A'}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.session_id || 'N/A'}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 600,
                            bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276',
                            borderRadius: '6px', fontFamily: fontStack,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getUserTypeLabel(test.user_type)}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 600,
                            bgcolor: utColor.bg, color: utColor.color,
                            borderRadius: '6px', fontFamily: fontStack,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <QuestionAnswerIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                            {test.total_questions || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: '0.85rem', fontWeight: 700, fontFamily: fontStack,
                            color: getScoreColor(test.score_percentage || 0),
                          }}
                        >
                          {test.final_score || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography
                            sx={{
                              fontSize: '0.85rem', fontWeight: 700, fontFamily: fontStack,
                              color: getScoreColor(test.score_percentage || 0),
                            }}
                          >
                            {test.score_percentage || 0}%
                          </Typography>
                          <GradeIcon sx={{ fontSize: 14, color: getScoreColor(test.score_percentage || 0) }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.test_completed ? 'Completed' : 'In Progress'}
                          size="small"
                          icon={test.test_completed
                            ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} />
                            : <AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', fontFamily: fontStack,
                            bgcolor: test.test_completed ? 'rgba(13,148,136,0.10)' : 'rgba(217,119,6,0.10)',
                            color: test.test_completed ? '#0d9488' : '#d97706',
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>
                          {formatTimestamp(test.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" width="110px" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={test.test_completed ? 100 : 50}
                            sx={{
                              width: '70px', height: 6, borderRadius: 3,
                              bgcolor: 'rgba(41,128,185,0.08)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: test.test_completed ? '#0d9488' : '#d97706',
                                borderRadius: 3,
                              },
                            }}
                          />
                          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', fontFamily: fontStack }}>
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
      </Box>
    </Box>
  );
};

export default ViewMockTest;