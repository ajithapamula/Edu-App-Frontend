import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Skeleton,
  Chip,
  Avatar,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Snackbar,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import {
  Refresh,
  Visibility,
  SearchOutlined,
  SchoolOutlined,
  GroupOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dailyStandupAPI } from '../../../services/API/dailystandup';

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
const StandupsShimmer = ({ rows = 6 }) => {
  const shimmerRows = Array.from({ length: rows }, (_, i) => i);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={260} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1].map((i) => (
          <Grid item xs={12} sm={6} key={i}>
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
              {[0, 1, 2].map((i) => (
                <TableCell key={i}><Skeleton variant="text" width={80 + i * 20} /></TableCell>
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
                      <Skeleton variant="text" width={120} />
                      <Skeleton variant="text" width={70} />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell><Skeleton variant="circular" width={34} height={34} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box display="flex" justifyContent="center" mt={3}>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading standup students...</Typography>
      </Box>
    </Box>
  );
};

const MentorDailyStandupsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
      setError(null);

      const response = await dailyStandupAPI.getAllStandupStudents();
      setStudents(response || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => loadData(true);

  const handleViewStudent = (student) => {
    navigate(`/mentor/daily-standups/view/${student.Student_ID}`);
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.name?.toLowerCase() || '').includes(term) ||
      (s.Student_ID?.toString() || '').includes(term)
    );
  });

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  if (loading) return <StandupsShimmer rows={6} />;

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
            <SchoolOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Daily Standup Students
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <StatCard
            icon={<GroupOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Total Students"
            value={students.length}
            gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            icon={<TrendingUpOutlined sx={{ color: '#fff', fontSize: 20 }} />}
            label="Active Rate"
            value="100%"
            gradient="linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)"
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
          placeholder="Search by name or student ID..."
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

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Box
          sx={{
            p: 5, textAlign: 'center', borderRadius: '16px', bgcolor: '#fff',
            border: '1px solid rgba(41,128,185,0.08)',
            boxShadow: '0 1px 3px rgba(26,82,118,0.04)',
          }}
        >
          <SchoolOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
            No Students Found
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {searchTerm
              ? 'No students match your current search. Try adjusting your search term.'
              : 'Try refreshing the data or check back later.'}
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
                  {['Student', 'Student ID', 'Actions'].map((h) => (
                    <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a5276', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: fontStack }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents
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
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              width: 36, height: 36, fontSize: '0.75rem', fontWeight: 700,
                              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
                              fontFamily: fontStack,
                            }}
                          >
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                              {student.name || 'Unknown'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                              Active Student
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.Student_ID}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.72rem', fontWeight: 600,
                            bgcolor: 'rgba(41,128,185,0.08)', color: '#1a5276',
                            borderRadius: '6px', fontFamily: fontStack,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Standup Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewStudent(student)}
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
            count={filteredStudents.length}
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

export default MentorDailyStandupsList;