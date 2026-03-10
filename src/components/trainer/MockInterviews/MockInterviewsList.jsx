import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
  Grid,
  Skeleton,
  CircularProgress,
  InputAdornment,
  Button,
  Snackbar,
  TablePagination,
} from '@mui/material';
import {
  Visibility,
  SearchOutlined,
  Refresh,
  TrendingUp,
  TrendingDown,
  Remove,
  GroupOutlined,
  StarOutlined,
  AssessmentOutlined,
  AnalyticsOutlined,
} from '@mui/icons-material';
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
const InterviewsShimmer = ({ rows = 6 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={280} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '14px' }} />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ p: 2, mb: 3, borderRadius: '14px', border: '1px solid rgba(41,128,185,0.08)', bgcolor: '#fff' }}>
        <Box display="flex" gap={2} alignItems="center">
          <Skeleton variant="rectangular" width={350} height={40} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '10px' }} />
        </Box>
      </Box>
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
        <Table>
          <TableHead>
            <TableRow>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <TableCell key={i}><Skeleton variant="text" width={60 + i * 10} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Skeleton variant="circular" width={36} height={36} />
                    <Box>
                      <Skeleton variant="text" width={100} />
                      <Skeleton variant="text" width={60} />
                    </Box>
                  </Box>
                </TableCell>
                {[0, 1, 2, 3, 4, 5].map((j) => (
                  <TableCell key={j}><Skeleton variant="text" width={50 + j * 8} /></TableCell>
                ))}
                <TableCell><Skeleton variant="circular" width={34} height={34} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box display="flex" justifyContent="center" mt={3}>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading interviews...</Typography>
      </Box>
    </Box>
  );
};

const MockInterviewSystem = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0, withScores: 0, averageOverallScore: 0, averageTechnicalScore: 0,
    averageCommunicationScore: 0, averageHrScore: 0,
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
    } catch (err) {
      console.error('Failed to load interviews:', err);
      setError(err.message);
      setInterviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => fetchData(true);

  const handleView = (interview) => {
    const interviewId = interview.testId || interview.id;
    navigate(`/trainer/mock-interviews/${interviewId}`);
  };

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

  const getScoreIcon = (score) => {
    if (score >= 8) return <TrendingUp sx={{ fontSize: 14, color: '#0d9488' }} />;
    if (score >= 6) return <Remove sx={{ fontSize: 14, color: '#d97706' }} />;
    return <TrendingDown sx={{ fontSize: 14, color: '#dc2626' }} />;
  };

  const filteredInterviews = interviews.filter((interview) => {
    const term = searchTerm.toLowerCase();
    return (
      interview.studentName.toLowerCase().includes(term) ||
      interview.testId.toLowerCase().includes(term) ||
      interview.studentId.toString().toLowerCase().includes(term)
    );
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: 'N/A', time: 'N/A' };
    let date;
    if (typeof timestamp === 'number') { date = new Date(timestamp * 1000); } else { date = new Date(timestamp); }
    if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const ScoreChip = ({ score }) => {
    if (score === null || score === undefined) {
      return <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack }}>Not scored</Typography>;
    }
    return (
      <Chip
        label={score}
        size="small"
        sx={{
          height: 24, fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px',
          fontFamily: fontStack, bgcolor: getScoreBg(score), color: getScoreColor(score),
        }}
      />
    );
  };

  if (loading) return <InterviewsShimmer rows={6} />;

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Snackbar */}
      <Snackbar open={!!error && !loading} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(239,68,68,0.15)' }}>
          {error}
          <Button color="inherit" size="small" onClick={handleRefresh} sx={{ ml: 1, fontWeight: 600 }}>Retry</Button>
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
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
              Weekly Interviews
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<GroupOutlined sx={{ color: '#fff', fontSize: 20 }} />} label="Total Interviews" value={stats.total} gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<AssessmentOutlined sx={{ color: '#fff', fontSize: 20 }} />} label="Assessed" value={stats.withScores} gradient="linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<StarOutlined sx={{ color: '#fff', fontSize: 20 }} />} label="Avg Overall Score" value={stats.averageOverallScore} gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<AnalyticsOutlined sx={{ color: '#fff', fontSize: 20 }} />} label="Avg Technical" value={stats.averageTechnicalScore} gradient="linear-gradient(135deg, #d97706 0%, #fbbf24 100%)" />
        </Grid>
      </Grid>

      {/* Search & Filter Bar */}
      <Box
        sx={{
          p: 2, mb: 3, borderRadius: '14px', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          display: 'flex', gap: 2, alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search by student name, student ID, or test ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 350, flex: 1, maxWidth: 500,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px', fontSize: '0.85rem', fontFamily: fontStack, bgcolor: '#f8fafc',
              '& fieldset': { borderColor: 'rgba(41,128,185,0.12)' },
              '&:hover fieldset': { borderColor: 'rgba(41,128,185,0.25)' },
              '&.Mui-focused fieldset': { borderColor: '#2980b9', borderWidth: '1.5px' },
            },
          }}
        />
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh sx={{ fontSize: '18px !important' }} />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: '0.82rem',
            borderRadius: '10px', borderColor: 'rgba(41,128,185,0.20)',
            color: '#2980b9', px: 2.5, fontFamily: fontStack,
            '&:hover': { borderColor: '#2980b9', bgcolor: 'rgba(41,128,185,0.04)' },
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Interviews Table */}
      {filteredInterviews.length === 0 ? (
        <Box
          sx={{
            p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          }}
        >
          <AssessmentOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
            No Interviews Found
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {searchTerm
              ? 'Try adjusting your search criteria to find interviews.'
              : 'No interview data is available at the moment.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(41,128,185,0.04)' }}>
                  {['Student', 'Test ID', 'Session', 'Date & Time', 'Overall', 'Technical', 'Communication', 'Actions'].map((h) => (
                    <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInterviews
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((interview) => {
                    const dateTime = formatTimestamp(interview.timestamp);
                    return (
                      <TableRow
                        key={interview.id}
                        hover
                        sx={{
                          transition: 'all 0.15s ease', cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' },
                          '&:last-child td': { borderBottom: 0 },
                          borderBottom: '1px solid rgba(41,128,185,0.06)',
                        }}
                        onClick={() => handleView(interview)}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              sx={{
                                width: 36, height: 36, fontSize: '0.75rem', fontWeight: 700,
                                background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                                fontFamily: fontStack,
                              }}
                            >
                              {interview.studentName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                                {interview.studentName}
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: fontStack }}>
                                ID: {interview.studentId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: '0.72rem', fontWeight: 600, fontFamily: 'monospace',
                              bgcolor: 'rgba(41,128,185,0.06)', color: '#1a5276',
                              px: 1, py: 0.3, borderRadius: '4px', display: 'inline-block',
                            }}
                          >
                            {interview.testId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`Session ${interview.sessionId}`}
                            size="small"
                            sx={{
                              height: 24, fontSize: '0.72rem', fontWeight: 600,
                              bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276',
                              borderRadius: '6px', fontFamily: fontStack,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                            {dateTime.date}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                            {dateTime.time}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {interview.overallScore !== null ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {getScoreIcon(interview.overallScore)}
                              <ScoreChip score={interview.overallScore} />
                            </Box>
                          ) : (
                            <ScoreChip score={null} />
                          )}
                        </TableCell>
                        <TableCell><ScoreChip score={interview.technicalScore} /></TableCell>
                        <TableCell><ScoreChip score={interview.communicationScore} /></TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleView(interview); }}
                              sx={{
                                width: 34, height: 34, borderRadius: '9px',
                                color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)',
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' },
                              }}
                            >
                              <Visibility sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredInterviews.length}
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
      )}
    </Box>
  );
};

export default MockInterviewSystem;