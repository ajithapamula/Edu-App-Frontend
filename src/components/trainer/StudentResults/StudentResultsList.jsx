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
  TextField,
  TablePagination,
  Skeleton,
  Alert,
  Snackbar,
  InputAdornment,
  Chip,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  SearchOutlined,
  TrendingUpOutlined,
  GroupOutlined,
  CheckCircleOutlined,
  SchoolOutlined,
  AssignmentOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import studentResultsService from '../../../services/API/studentresults';

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
        width: 42, height: 42, borderRadius: '11px',
        background: gradient,
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
const ResultsShimmer = ({ rows = 6 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={220} height={40} sx={{ borderRadius: 2 }} />
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
              {['', '', '', '', '', ''].map((_, i) => (
                <TableCell key={i}><Skeleton variant="text" width={70 + i * 15} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shimmerRows.map((index) => (
              <TableRow key={index}>
                <TableCell><Skeleton variant="text" width={120} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell><Skeleton variant="circular" width={34} height={34} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box display="flex" justifyContent="center" mt={3}>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading student results...</Typography>
      </Box>
    </Box>
  );
};

const StudentResultsList = () => {
  const navigate = useNavigate();
  const [studentResults, setStudentResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchStudentResults(); }, []);

  const fetchStudentResults = async (isRefresh = false) => {
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
      setError(null);

      const response = await studentResultsService.getAllStudentResults();

      if (response.success) {
        setStudentResults(response.data);
      } else {
        setError(response.error || 'Failed to fetch student results');
      }
    } catch (err) {
      console.error('Error fetching student results:', err);
      setError('Failed to fetch student results. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => fetchStudentResults(true);

  const handleViewDetails = (student) => {
    navigate(`/trainer/student-results/view/${student.Student_ID}`);
  };

  const getScoreColor = (pct) => {
    const n = parseFloat(pct);
    if (n >= 80) return '#0d9488';
    if (n >= 60) return '#2980b9';
    if (n >= 40) return '#d97706';
    return '#dc2626';
  };

  const getScoreBg = (pct) => {
    const n = parseFloat(pct);
    if (n >= 80) return 'rgba(13,148,136,0.10)';
    if (n >= 60) return 'rgba(41,128,185,0.10)';
    if (n >= 40) return 'rgba(217,119,6,0.10)';
    return 'rgba(220,38,38,0.10)';
  };

  const getPerformanceLabel = (pct) => {
    const n = parseFloat(pct);
    if (n >= 90) return 'Excellent';
    if (n >= 80) return 'Good';
    if (n >= 60) return 'Average';
    if (n > 0) return 'Poor';
    return 'N/A';
  };

  const filteredResults = studentResults.filter((s) =>
    s.Student_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  /* ——— Computed Stats ——— */
  const totalStudents = filteredResults.length;
  const goodAttendance = filteredResults.filter((s) => parseFloat(s.Avg_Attendance_Percentage) >= 80).length;
  const avgAttendance = totalStudents > 0
    ? (filteredResults.reduce((sum, s) => sum + parseFloat(s.Avg_Attendance_Percentage), 0) / totalStudents).toFixed(1)
    : '0.0';
  const avgMockTest = totalStudents > 0
    ? (filteredResults.reduce((sum, s) => sum + parseFloat(s.Overall_Mock_Test_Percentage), 0) / totalStudents).toFixed(1)
    : '0.0';

  if (loading) return <ResultsShimmer rows={6} />;

  /* ——— Score Cell Helper ——— */
  const ScoreCell = ({ value }) => {
    const pct = parseFloat(value);
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: getScoreColor(value), fontFamily: fontStack }}>
          {value}%
        </Typography>
        {pct > 0 && (
          <Chip
            label={getPerformanceLabel(value)}
            size="small"
            sx={{
              height: 22, fontSize: '0.68rem', fontWeight: 600, borderRadius: '6px',
              fontFamily: fontStack, bgcolor: getScoreBg(value), color: getScoreColor(value),
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(239,68,68,0.15)' }}>
          {error}
          <Button color="inherit" size="small" onClick={handleRefresh} sx={{ ml: 1, fontWeight: 600 }}>Retry</Button>
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(13,148,136,0.15)' }}>{success}</Alert>
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
            <TrendingUpOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Student Results
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              {filteredResults.length} student{filteredResults.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<GroupOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Total Students"
            value={totalStudents}
            gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircleOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Good Attendance"
            value={goodAttendance}
            gradient="linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SchoolOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Avg Attendance"
            value={`${avgAttendance}%`}
            gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AssignmentOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Avg Mock Test"
            value={`${avgMockTest}%`}
            gradient="linear-gradient(135deg, #d97706 0%, #fbbf24 100%)"
          />
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
          placeholder="Search by student name..."
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

      {/* Results Table */}
      {filteredResults.length === 0 ? (
        <Box
          sx={{
            p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          }}
        >
          <TrendingUpOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
            No Results Found
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {searchTerm
              ? 'No students match your current search. Try adjusting your search term.'
              : 'No student results available.'}
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
                  {['Student Name', 'Attendance %', 'Mock Test %', 'Mock Interview %', 'Standup Call %', 'Actions'].map((h) => (
                    <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((student) => (
                    <TableRow
                      key={student.Student_ID}
                      hover
                      sx={{
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(41,128,185,0.03)' },
                        '&:last-child td': { borderBottom: 0 },
                        borderBottom: '1px solid rgba(41,128,185,0.06)',
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                          {student.Student_Name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                          ID: {student.Student_ID}
                        </Typography>
                      </TableCell>
                      <TableCell><ScoreCell value={student.Avg_Attendance_Percentage} /></TableCell>
                      <TableCell><ScoreCell value={student.Overall_Mock_Test_Percentage} /></TableCell>
                      <TableCell><ScoreCell value={student.Overall_Mock_Interview_Percentage} /></TableCell>
                      <TableCell><ScoreCell value={student.Overall_Standup_Call_Percentage} /></TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(student)}
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
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredResults.length}
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

export default StudentResultsList;