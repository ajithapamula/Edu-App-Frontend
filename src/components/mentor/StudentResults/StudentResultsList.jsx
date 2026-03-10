import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Skeleton,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import studentResultsService from '../../../services/API/studentresults';

/* ── inject fonts + keyframes ── */
const _style = document.getElementById('sr-list-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'sr-list-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes srFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes srSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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
  '& .MuiInputLabel-root': { fontFamily: '"DM Sans", sans-serif', color: '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0ea5e9' },
};

const ResultsTableSkeleton = () => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" alignItems="center" gap={2} mb={2.5}>
      <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
      <Box><Skeleton variant="text" width={200} height={32} /><Skeleton variant="text" width={130} height={18} /></Box>
    </Box>
    <Box display="flex" gap={2} mb={2.5}>{[0,1,2,3].map(i => <Skeleton key={i} variant="rounded" sx={{ flex: 1, height: 80, borderRadius: '14px' }} />)}</Box>
    <Skeleton variant="rounded" width="100%" height={50} sx={{ borderRadius: '14px', mb: 2.5 }} />
    <Skeleton variant="rounded" width="100%" height={350} sx={{ borderRadius: '14px' }} />
  </Box>
);

const MentorStudentResultsList = () => {
  const navigate = useNavigate();
  const [studentResults, setStudentResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStudentResults(); }, []);

  useEffect(() => {
    const filtered = studentResults.filter(student =>
      student.Student_Name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResults(filtered);
  }, [studentResults, searchTerm]);

  const fetchStudentResults = async (isRefresh = false) => {
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
      setError('');
      const response = await studentResultsService.getAllStudentResults();
      if (response.success) { console.log('API Response:', response.data); setStudentResults(response.data); }
      else { setError(response.error || 'Failed to fetch student results'); }
    } catch (error) { console.error('Error fetching student results:', error); setError('Failed to fetch student results. Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = () => { fetchStudentResults(true); };
  const handleViewDetails = (student) => { navigate(`/mentor/student-results/view/${student.Student_ID}`); };

  const getPerformanceColor = (percentage) => {
    const n = parseFloat(percentage);
    if (n >= 80) return '#0d9488'; if (n >= 60) return '#0ea5e9'; if (n >= 40) return '#f59e0b'; return '#ef4444';
  };
  const getPerformanceBg = (percentage) => {
    const n = parseFloat(percentage);
    if (n >= 80) return '#f0fdf4'; if (n >= 60) return '#f0f4ff'; if (n >= 40) return '#fffbeb'; return '#fef2f2';
  };
  const getPerformanceLabel = (percentage) => {
    const n = parseFloat(percentage);
    if (n >= 90) return 'Excellent'; if (n >= 80) return 'Good'; if (n >= 60) return 'Average'; if (n > 0) return 'Poor'; return 'N/A';
  };

  if (loading) return <ResultsTableSkeleton />;

  const statCards = [
    { label: 'Total Students', value: filteredResults.length, icon: <PeopleIcon sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { label: 'Good Attendance', value: filteredResults.filter(s => parseFloat(s.Avg_Attendance_Percentage) >= 80).length, icon: <CheckCircleIcon sx={{ fontSize: 22 }} />, color: '#0d9488' },
    { label: 'Avg Attendance', value: filteredResults.length > 0 ? `${(filteredResults.reduce((sum, s) => sum + parseFloat(s.Avg_Attendance_Percentage), 0) / filteredResults.length).toFixed(1)}%` : '0%', icon: <AssessmentIcon sx={{ fontSize: 22 }} />, color: '#0ea5e9' },
    { label: 'Avg Mock Test', value: filteredResults.length > 0 ? `${(filteredResults.reduce((sum, s) => sum + parseFloat(s.Overall_Mock_Test_Percentage), 0) / filteredResults.length).toFixed(1)}%` : '0%', icon: <QuizIcon sx={{ fontSize: 22 }} />, color: '#f59e0b' },
  ];

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, animation: 'srFadeUp 0.5s ease-out both' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <TrendingUpIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2 }}>Student Results</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>{filteredResults.length} student{filteredResults.length !== 1 ? 's' : ''} found</Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh results" arrow>
          <IconButton onClick={handleRefresh} disabled={refreshing} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease',
          }}>
            <RefreshIcon sx={{ fontSize: 20, color: '#475569', animation: refreshing ? 'srSpin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, animation: 'srFadeUp 0.5s ease-out 0.1s both' }}>
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
      <Paper elevation={0} sx={{ ...crd, p: 2.5, mb: 2.5, animation: 'srFadeUp 0.5s ease-out 0.15s both' }}>
        <TextField fullWidth size="small" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ ...inputSx, maxWidth: 400 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment> }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}
          action={<Button color="inherit" size="small" onClick={handleRefresh} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none' }}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper elevation={0} sx={{ ...crd, overflow: 'hidden', animation: 'srFadeUp 0.5s ease-out 0.2s both' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Student Name', 'Attendance %', 'Mock Test %', 'Mock Interview %', 'Standup Call %', 'Actions'].map(h => (
                  <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.5,
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ borderBottom: 'none', py: 5 }}>
                    <Box textAlign="center">
                      <Box sx={{ width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 1.5, background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUpIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ ...hFont, fontSize: '1rem', mb: 0.5 }}>No Results Found</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>
                        {searchTerm ? 'No students found matching your search.' : 'No student results available.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((student) => (
                  <TableRow key={student.Student_ID} sx={{
                    transition: 'background 0.2s ease', '&:hover': { background: '#f8fafc' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}>
                    {/* Name */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.8 }}>
                      <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600 }}>{student.Student_Name}</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#94a3b8' }}>ID: {student.Student_ID}</Typography>
                    </TableCell>
                    {/* Metrics */}
                    {[student.Avg_Attendance_Percentage, student.Overall_Mock_Test_Percentage, student.Overall_Mock_Interview_Percentage, student.Overall_Standup_Call_Percentage].map((val, i) => {
                      const n = parseFloat(val);
                      const color = getPerformanceColor(val);
                      const bg = getPerformanceBg(val);
                      const label = getPerformanceLabel(val);
                      return (
                        <TableCell key={i} sx={{ borderBottom: '1px solid #f1f5f9', py: 1.8 }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 700, color }}>{val}%</Typography>
                            {(n > 0 || i === 0) && (
                              <Chip label={label} size="small" sx={{
                                height: 22, fontSize: '0.65rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                                background: bg, color, border: `1px solid ${color}25`,
                              }} />
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                    {/* Actions */}
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9', py: 1.8 }}>
                      <Tooltip title="View Details" arrow>
                        <IconButton size="small" onClick={() => handleViewDetails(student)} sx={{
                          width: 32, height: 32, borderRadius: '8px', color: '#0ea5e9',
                          background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)',
                          transition: 'all 0.25s ease',
                          '&:hover': { background: 'rgba(14,165,233,0.12)', borderColor: 'rgba(14,165,233,0.25)', transform: 'translateY(-1px)' },
                        }}>
                          <VisibilityIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default MentorStudentResultsList;