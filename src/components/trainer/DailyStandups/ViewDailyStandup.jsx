import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Button,
  TablePagination,
} from '@mui/material';
import {
  PersonOutlined,
  TrendingUpOutlined,
  ArrowBack,
  Refresh,
  QuizOutlined,
  AssignmentOutlined,
  SchoolOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import dailyStandupApiService from '../../../services/API/dailystandup';

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
const ViewStandupShimmer = () => (
  <Box>
    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
      <Skeleton variant="circular" width={34} height={34} />
      <Skeleton variant="text" width={280} height={36} />
    </Box>
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[0, 1, 2, 3].map((i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '14px' }} />
        </Grid>
      ))}
    </Grid>
    <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Table>
        <TableHead>
          <TableRow>
            {[0, 1, 2, 3, 4].map((i) => (
              <TableCell key={i}><Skeleton variant="text" width={60 + i * 15} /></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[0, 1, 2].map((i) => (
            <TableRow key={i}>
              {[0, 1, 2, 3, 4].map((j) => (
                <TableCell key={j}><Skeleton variant="text" width={50 + j * 10} /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  </Box>
);

const ViewDailyStandup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentTests = await dailyStandupApiService.getStudentStandupTests(id);
      if (!studentTests || studentTests.length === 0) {
        throw new Error('No test data found for this student');
      }
      setTestData(studentTests);
    } catch (err) {
      console.error('Error fetching test data:', err);
      setError(err.message || 'Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchTestData(); }, [id]);

  const handleBack = () => navigate('/trainer/daily-standups');
  const handleRetry = () => fetchTestData();

  const getScoreColor = (score) => {
    if (score >= 8) return '#0d9488';
    if (score >= 6) return '#2980b9';
    if (score >= 4) return '#d97706';
    return '#dc2626';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'rgba(13,148,136,0.10)';
    if (score >= 6) return 'rgba(41,128,185,0.10)';
    if (score >= 4) return 'rgba(217,119,6,0.10)';
    return 'rgba(220,38,38,0.10)';
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  if (loading) return <ViewStandupShimmer />;

  if (error || !testData || testData.length === 0) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', boxShadow: '0 4px 16px rgba(239,68,68,0.10)' }}>
          {error || `No test data found for Student ID: ${id}`}
          <Button color="inherit" size="small" onClick={handleRetry} sx={{ ml: 1, fontWeight: 600 }}>Retry</Button>
        </Alert>
        <Button
          onClick={handleBack}
          startIcon={<ArrowBack sx={{ fontSize: '18px !important' }} />}
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

  const testCount = testData.length;
  const studentName = testData[0]?.name || `Student ${id}`;
  const studentId = testData[0]?.Student_ID || id;
  const sessionId = testData[0]?.session_id;
  const averageScore = testData.reduce((sum, t) => sum + (t.score || 0), 0) / testCount;
  const maxScore = Math.max(...testData.map((t) => t.score || 0));
  const minScore = Math.min(...testData.map((t) => t.score || 0));

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            onClick={handleBack}
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
            <AssignmentOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Test Data — {studentName}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              Session {sessionId}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton
            onClick={handleRetry}
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' },
            }}
          >
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PersonOutlined sx={{ color: '#fff', fontSize: 20 }} />} label={studentName} value={`ID: ${studentId}`} gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<QuizOutlined sx={{ color: '#fff', fontSize: 20 }} />} label="Total Tests" value={testCount} gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<TrendingUpOutlined sx={{ color: '#fff', fontSize: 20 }} />} label="Average Score" value={`${averageScore.toFixed(1)}/10`} gradient="linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<SchoolOutlined sx={{ color: '#fff', fontSize: 20 }} />} label="Session ID" value={sessionId} gradient="linear-gradient(135deg, #d97706 0%, #fbbf24 100%)" />
        </Grid>
      </Grid>

      {/* Test Data Table */}
      <Box
        sx={{
          borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', mb: 3,
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(41,128,185,0.08)', bgcolor: 'rgba(41,128,185,0.02)' }}>
          <AssignmentOutlined sx={{ fontSize: 16, color: '#1a5276' }} />
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a5276', fontFamily: fontStack }}>
            Test Details ({testCount} test{testCount > 1 ? 's' : ''})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(41,128,185,0.04)' }}>
                {['Test ID', 'Student ID', 'Name', 'Session ID', 'Score'].map((h) => (
                  <TableCell key={h}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {testData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((test, index) => (
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
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: 'monospace', color: '#1a5276' }}>
                        {test.test_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                        {test.Student_ID}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{
                            width: 32, height: 32, fontSize: '0.7rem', fontWeight: 700,
                            background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                            fontFamily: fontStack,
                          }}
                        >
                          {test.name ? test.name.charAt(0) : 'S'}
                        </Avatar>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                          {test.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.session_id}
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
                        label={`${test.score}/10`}
                        size="small"
                        sx={{
                          height: 24, fontSize: '0.72rem', fontWeight: 700,
                          bgcolor: getScoreBg(test.score), color: getScoreColor(test.score),
                          borderRadius: '6px', fontFamily: fontStack,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={testData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid rgba(41,128,185,0.06)',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.8rem', color: '#94a3b8', fontFamily: fontStack,
            },
          }}
        />
      </Box>

      {/* Summary Section */}
      <Grid container spacing={2}>
        {/* Score Analysis */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 3, borderRadius: '16px', bgcolor: '#fff', height: '100%',
              border: '1px solid rgba(41,128,185,0.08)',
              boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpOutlined sx={{ color: '#fff', fontSize: 16 }} />
              </Box>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                Score Analysis
              </Typography>
            </Box>
            {[
              { label: 'Highest Score', value: `${maxScore}/10`, score: maxScore },
              { label: 'Lowest Score', value: `${minScore}/10`, score: minScore },
              { label: 'Average Score', value: `${averageScore.toFixed(1)}/10`, score: averageScore },
              { label: 'Score Range', value: minScore === maxScore ? `${minScore}/10` : `${minScore}–${maxScore}/10`, score: null },
            ].map((item, i) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: 1.2,
                  borderBottom: i < 3 ? '1px solid rgba(41,128,185,0.06)' : 'none',
                }}
              >
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', fontFamily: fontStack }}>
                  {item.label}
                </Typography>
                {item.score !== null ? (
                  <Chip
                    label={item.value}
                    size="small"
                    sx={{
                      height: 24, fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px',
                      fontFamily: fontStack, bgcolor: getScoreBg(item.score), color: getScoreColor(item.score),
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                    {item.value}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Test Information */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 3, borderRadius: '16px', bgcolor: '#fff', height: '100%',
              border: '1px solid rgba(41,128,185,0.08)',
              boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DescriptionOutlined sx={{ color: '#fff', fontSize: 16 }} />
              </Box>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
                Test Information
              </Typography>
            </Box>
            {[
              { label: 'Student Name', value: studentName },
              { label: 'Student ID', value: studentId },
              { label: 'Session ID', value: sessionId },
              { label: 'Total Tests', value: testCount },
            ].map((item, i) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: 1.2,
                  borderBottom: i < 3 ? '1px solid rgba(41,128,185,0.06)' : 'none',
                }}
              >
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', fontFamily: fontStack }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ViewDailyStandup;