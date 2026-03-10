import React, { useState, useEffect } from 'react';
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
  Alert,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  Chip,
  Avatar,
  Tooltip,
  Fade,
  Zoom,
  Grid,
  useTheme,
  alpha,
  styled,
  keyframes
} from '@mui/material';
import { 
  Refresh, 
  Visibility, 
  Person, 
  School,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dailyStandupApiService from '../../../services/API/dailystandup';

/* ── inject fonts + keyframes ── */
const _s = document.getElementById('ds-list-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'ds-list-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes dsFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes dsSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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
      <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
      <Box><Skeleton variant="text" width={220} height={32} /><Skeleton variant="text" width={150} height={18} /></Box>
    </Box>
    <Box display="flex" gap={2} mb={2.5}>
      {[0,1].map(i => <Skeleton key={i} variant="rounded" sx={{ flex: 1, height: 80, borderRadius: '14px' }} />)}
    </Box>
    <Skeleton variant="rounded" width="100%" height={300} sx={{ borderRadius: '14px' }} />
  </Box>
);

const MentorDailyStandupsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const theme = useTheme();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      console.log('Loading standup students from API...');
      const response = await dailyStandupApiService.getAllStandupStudents();
      console.log('API Response:', response);
      setStudents(response || []);
      setCount(response ? response.length : 0);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message); setStudents([]); setCount(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => { loadData(); };

  const handleViewStudent = (student) => {
    console.log('Navigating to view student:', student.Student_ID);
    navigate(`/mentor/daily-standups/view/${student.Student_ID}`);
  };

  const getAvatarColor = (studentId) => {
    const colors = ['#1e3a8a', '#0ea5e9', '#0d9488', '#f59e0b', '#7c3aed', '#ef4444'];
    const index = studentId ? studentId.toString().charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  if (loading) return <PageSkeleton />;

  if (error && !loading) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, md: 3 }, boxSizing: 'border-box' }}>
        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <School sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography sx={{ ...hFont, fontSize: '1.45rem' }}>Daily Standup Students</Typography>
        </Box>
        <Alert severity="error" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}
          action={<IconButton size="small" onClick={handleRefresh}><Refresh sx={{ fontSize: 20 }} /></IconButton>}>
          Failed to load data: {error}
        </Alert>
      </Box>
    );
  }

  const statCards = [
    { label: 'Total Students', value: count, icon: <Person sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { label: 'Active Rate', value: '100%', icon: <TrendingUp sx={{ fontSize: 22 }} />, color: '#0d9488' },
  ];

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, animation: 'dsFadeUp 0.5s ease-out both' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <School sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>Daily Standup Students</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>Manage and view student information</Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh Data" arrow>
          <IconButton onClick={handleRefresh} disabled={loading} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease',
          }}>
            <Refresh sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, animation: 'dsFadeUp 0.5s ease-out 0.1s both' }}>
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

      {/* Table */}
      <Paper elevation={0} sx={{ ...crd, overflow: 'hidden', animation: 'dsFadeUp 0.5s ease-out 0.2s both' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Student', 'Student ID', 'Actions'].map(h => (
                  <TableCell key={h} align={h === 'Actions' ? 'center' : 'left'} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.5,
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ borderBottom: 'none', py: 5 }}>
                    <Box textAlign="center">
                      <Box sx={{ width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 1.5, background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Person sx={{ color: '#0ea5e9', fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ ...hFont, fontSize: '1rem', mb: 0.5 }}>No Students Found</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>Try refreshing the data or check back later</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.Student_ID} sx={{
                    transition: 'background 0.2s ease', '&:hover': { background: '#f8fafc' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{
                          width: 36, height: 36, fontSize: '0.78rem',
                          fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                          background: `linear-gradient(135deg, ${getAvatarColor(student.Student_ID)}, ${getAvatarColor(student.Student_ID)}90)`,
                          boxShadow: '0 2px 8px rgba(30,58,138,0.15)',
                        }}>
                          {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                        </Avatar>
                        <Box>
                          <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600 }}>{student.name || 'Unknown'}</Typography>
                          <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8' }}>Active Student</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                      <Chip label={`#${student.Student_ID}`} size="small" sx={{
                        height: 26, fontSize: '0.76rem', fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontWeight: 600, background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
                      }} />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                      <Tooltip title="View Standup Details" arrow>
                        <IconButton size="small" onClick={() => handleViewStudent(student)} sx={{
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default MentorDailyStandupsList;