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
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Alert,
  Button,
  Skeleton,
  Divider,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import studentResultsService from '../../../services/API/studentresults';

/* ── inject fonts + keyframes ── */
const _style = document.getElementById('sr-view-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'sr-view-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes srvFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const crd = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };

const MentorViewStudentResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (id) fetchStudentData(); }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true); setError('');
      const response = await studentResultsService.getAllStudentResults();
      if (response.success && response.data) {
        const student = response.data.find(s => s.Student_ID === parseInt(id));
        if (student) setStudentData(student); else setError('Student not found');
      } else { setError(response.error || 'Failed to fetch student data'); }
    } catch (error) { console.error('Error fetching student data:', error); setError('Failed to fetch student data'); }
    finally { setLoading(false); }
  };

  const getPerformanceColor = (percentage) => {
    const n = parseFloat(percentage);
    if (n >= 90) return '#0d9488'; if (n >= 80) return '#0ea5e9'; if (n >= 70) return '#f59e0b'; if (n >= 60) return '#7c3aed'; return '#ef4444';
  };
  const getPerformanceBg = (percentage) => {
    const n = parseFloat(percentage);
    if (n >= 90) return '#f0fdf4'; if (n >= 80) return '#f0f4ff'; if (n >= 70) return '#fffbeb'; if (n >= 60) return '#f5f3ff'; return '#fef2f2';
  };
  const getPerformanceLabel = (percentage) => {
    const n = parseFloat(percentage);
    if (n >= 90) return 'Outstanding'; if (n >= 80) return 'Excellent'; if (n >= 70) return 'Good'; if (n >= 60) return 'Satisfactory'; if (n > 0) return 'Needs Improvement'; return 'No Data';
  };
  const getPerformanceChipColor = (percentage) => {
    const n = parseFloat(percentage);
    if (n >= 90) return 'success'; if (n >= 80) return 'info'; if (n >= 70) return 'warning'; if (n >= 60) return 'secondary'; return 'error';
  };
  const getOverallStatus = (student) => {
    const avg = (parseFloat(student.Avg_Attendance_Percentage) + parseFloat(student.Overall_Mock_Test_Percentage) + parseFloat(student.Overall_Mock_Interview_Percentage) + parseFloat(student.Overall_Standup_Call_Percentage)) / 4;
    if (avg >= 85) return { status: 'Outstanding Performance', color: '#0d9488', chipColor: 'success', icon: <TrophyIcon sx={{ fontSize: 18 }} /> };
    if (avg >= 75) return { status: 'Excellent Progress', color: '#0ea5e9', chipColor: 'info', icon: <AssessmentIcon sx={{ fontSize: 18 }} /> };
    if (avg >= 65) return { status: 'Good Development', color: '#f59e0b', chipColor: 'warning', icon: <SchoolIcon sx={{ fontSize: 18 }} /> };
    if (avg >= 50) return { status: 'Satisfactory', color: '#7c3aed', chipColor: 'secondary', icon: <TimelineIcon sx={{ fontSize: 18 }} /> };
    return { status: 'Needs Improvement', color: '#ef4444', chipColor: 'error', icon: <PersonIcon sx={{ fontSize: 18 }} /> };
  };

  if (loading) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
          <Box sx={{ flex: 1 }}><Skeleton variant="text" width={300} height={32} /><Skeleton variant="text" width={200} height={18} /></Box>
        </Box>
        <Box display="flex" gap={2.5} flexDirection={{ xs: 'column', lg: 'row' }}>
          <Skeleton variant="rounded" sx={{ flex: '1 1 30%', height: 350, borderRadius: '14px' }} />
          <Box sx={{ flex: '1 1 70%' }}>
            <Box display="flex" gap={2} flexWrap="wrap" mb={2.5}>{[0,1,2,3].map(i => <Skeleton key={i} variant="rounded" sx={{ flex: '1 1 calc(50% - 8px)', height: 130, borderRadius: '14px' }} />)}</Box>
          </Box>
        </Box>
        <Skeleton variant="rounded" width="100%" height={250} sx={{ borderRadius: '14px', mt: 2.5 }} />
      </Box>
    );
  }

  if (error || !studentData) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff' } }}>
            <ArrowBackIcon sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...hFont, fontSize: '1.3rem' }}>Student Performance</Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}
          action={<Button color="inherit" size="small" onClick={fetchStudentData} sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none' }}>Retry</Button>}>
          {error || 'Student not found'}
        </Alert>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} variant="contained" disableElevation sx={{
          background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 600, textTransform: 'none', borderRadius: '10px', boxShadow: '0 4px 14px rgba(14,165,233,0.25)',
          '&:hover': { background: 'linear-gradient(135deg, #0284c7, #0d9488)' },
        }}>Go Back</Button>
      </Box>
    );
  }

  const overallStatus = getOverallStatus(studentData);
  const averageScore = ((parseFloat(studentData.Avg_Attendance_Percentage) + parseFloat(studentData.Overall_Mock_Test_Percentage) + parseFloat(studentData.Overall_Mock_Interview_Percentage) + parseFloat(studentData.Overall_Standup_Call_Percentage)) / 4).toFixed(1);

  const metricCards = [
    { title: 'Attendance', value: studentData.Avg_Attendance_Percentage, icon: <PersonIcon sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { title: 'Mock Tests', value: studentData.Overall_Mock_Test_Percentage, icon: <AssessmentIcon sx={{ fontSize: 22 }} />, color: '#0ea5e9' },
    { title: 'Mock Interviews', value: studentData.Overall_Mock_Interview_Percentage, icon: <SchoolIcon sx={{ fontSize: 22 }} />, color: '#0d9488' },
    { title: 'Standup Calls', value: studentData.Overall_Standup_Call_Percentage, icon: <TimelineIcon sx={{ fontSize: 22 }} />, color: '#f59e0b' },
  ];

  const summaryCards = [
    { label: 'Student ID', value: studentData.Student_ID, color: '#1e3a8a', icon: <PersonIcon sx={{ fontSize: 22 }} /> },
    { label: 'Best Performance', value: `${Math.max(parseFloat(studentData.Avg_Attendance_Percentage), parseFloat(studentData.Overall_Mock_Test_Percentage), parseFloat(studentData.Overall_Mock_Interview_Percentage), parseFloat(studentData.Overall_Standup_Call_Percentage)).toFixed(1)}%`, color: '#0d9488', icon: <TrophyIcon sx={{ fontSize: 22 }} /> },
    { label: 'Average Score', value: `${averageScore}%`, color: '#0ea5e9', icon: <AssessmentIcon sx={{ fontSize: 22 }} /> },
    { label: 'Overall Status', value: overallStatus.status, color: overallStatus.color, icon: overallStatus.icon, isChip: true },
  ];

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, animation: 'srvFadeUp 0.5s ease-out both', flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
            <ArrowBackIcon sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
            <TrendingUpIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>Student Performance Dashboard</Typography>
            <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>Comprehensive performance analysis</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          {[{ icon: <DownloadIcon sx={{ fontSize: 18 }} />, title: 'Download Report' }, { icon: <PrintIcon sx={{ fontSize: 18 }} />, title: 'Print Report' }].map((a, i) => (
            <Tooltip key={i} title={a.title} arrow>
              <IconButton sx={{ width: 36, height: 36, borderRadius: '9px', background: '#fff', border: '1px solid #e8ecf2', color: '#475569', '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease' }}>
                {a.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', lg: 'row' }, animation: 'srvFadeUp 0.5s ease-out 0.1s both' }}>
        {/* Student Info Card */}
        <Paper elevation={0} sx={{ ...crd, flex: { xs: '1 1 100%', lg: '0 0 280px' }, overflow: 'hidden' }}>
          {/* Top gradient strip */}
          <Box sx={{ height: 80, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', transform: 'translate(20%, -30%)' }} />
          </Box>
          <Box sx={{ p: 3, pt: 0, mt: -5, textAlign: 'center' }}>
            <Avatar sx={{
              width: 72, height: 72, mx: 'auto', mb: 2,
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.6rem', fontWeight: 800,
              background: '#fff', color: '#0ea5e9',
              border: '3px solid #fff', boxShadow: '0 4px 16px rgba(14,165,233,0.20)',
            }}>
              {studentData.Student_Name?.charAt(0) || 'S'}
            </Avatar>
            <Typography sx={{ ...hFont, fontSize: '1.15rem', mb: 0.3 }}>{studentData.Student_Name}</Typography>
            <Chip label={`ID: ${studentData.Student_ID}`} size="small" sx={{
              height: 24, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
              background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe', mb: 3,
            }} />

            <Divider sx={{ mb: 2.5, borderColor: '#f1f5f9' }} />

            <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>Overall Performance</Typography>
            <Box display="flex" justifyContent="center" alignItems="center" gap={0.5} mb={1}>
              <Box sx={{ color: overallStatus.color }}>{React.cloneElement(overallStatus.icon, { sx: { fontSize: 22 } })}</Box>
              <Typography sx={{ ...hFont, fontSize: '1.8rem', lineHeight: 1, color: overallStatus.color }}>{averageScore}%</Typography>
            </Box>
            <Chip label={overallStatus.status} color={overallStatus.chipColor} size="small" sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '0.72rem',
            }} />
          </Box>
        </Paper>

        {/* Metric Cards */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {metricCards.map((m, i) => {
              const perfColor = getPerformanceColor(m.value);
              const perfBg = getPerformanceBg(m.value);
              return (
                <Paper key={i} elevation={0} sx={{
                  ...crd, p: 3, flex: '1 1 calc(50% - 8px)', minWidth: 180, textAlign: 'center',
                  transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 28px rgba(30,58,138,0.10)', transform: 'translateY(-3px)' },
                }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', mx: 'auto', mb: 1.5, background: `${m.color}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                    {m.icon}
                  </Box>
                  <Typography sx={{ ...hFont, fontSize: '2rem', lineHeight: 1.1, color: perfColor, mb: 0.5 }}>{m.value}%</Typography>
                  <Typography sx={{ ...bFont, fontSize: '0.84rem', fontWeight: 500, mb: 1 }}>{m.title}</Typography>
                  <Chip label={getPerformanceLabel(m.value)} size="small" sx={{
                    height: 24, fontSize: '0.68rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    background: perfBg, color: perfColor, border: `1px solid ${perfColor}25`,
                  }} />
                </Paper>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Detailed Performance */}
      <Paper elevation={0} sx={{ ...crd, p: 3, mt: 2.5, animation: 'srvFadeUp 0.5s ease-out 0.2s both' }}>
        <Typography sx={{ ...hFont, fontSize: '1.1rem', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUpIcon sx={{ color: '#0ea5e9', fontSize: 18 }} />
          </Box>
          Detailed Performance Analysis
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Attendance Performance', value: studentData.Avg_Attendance_Percentage },
            { label: 'Mock Test Performance', value: studentData.Overall_Mock_Test_Percentage },
            { label: 'Mock Interview Performance', value: studentData.Overall_Mock_Interview_Percentage },
            { label: 'Standup Call Performance', value: studentData.Overall_Standup_Call_Percentage },
          ].map((item, i) => {
            const color = getPerformanceColor(item.value);
            return (
              <Box key={i} sx={{
                flex: '1 1 calc(50% - 8px)', minWidth: 240, p: 2.5, borderRadius: '12px',
                background: '#f8fafc', border: '1px solid #f1f5f9',
                transition: 'all 0.3s ease', '&:hover': { background: '#f0f4ff', borderColor: '#dbeafe', transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(30,58,138,0.06)' },
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600 }}>{item.label}</Typography>
                  <Chip label={`${item.value}%`} size="small" sx={{
                    height: 24, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    background: getPerformanceBg(item.value), color, border: `1px solid ${color}25`, minWidth: 55,
                  }} />
                </Box>
                <LinearProgress variant="determinate" value={parseFloat(item.value)} sx={{
                  height: 6, borderRadius: 3, backgroundColor: '#e8ecf2', mb: 1,
                  '& .MuiLinearProgress-bar': { borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}90)` },
                }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#94a3b8' }}>{getPerformanceLabel(item.value)}</Typography>
                  <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#94a3b8' }}>Target: 80%</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Summary & Insights */}
      <Paper elevation={0} sx={{ ...crd, p: 3, mt: 2.5, mb: 3, animation: 'srvFadeUp 0.5s ease-out 0.3s both' }}>
        <Typography sx={{ ...hFont, fontSize: '1.1rem', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrophyIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
          </Box>
          Performance Summary & Insights
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {summaryCards.map((item, i) => (
            <Paper key={i} elevation={0} sx={{
              flex: '1 1 calc(25% - 12px)', minWidth: 170, p: 2.5, textAlign: 'center',
              borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9',
              transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(30,58,138,0.08)', borderColor: '#dbeafe' },
            }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', mx: 'auto', mb: 1.5, background: `${item.color}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                {item.icon}
              </Box>
              {item.isChip ? (
                <Chip label={item.value} color={overallStatus.chipColor} size="small" sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '0.72rem', mb: 1,
                }} />
              ) : (
                <Typography sx={{ ...hFont, fontSize: '1.15rem', color: item.color, mb: 0.5 }}>{item.value}</Typography>
              )}
              <Typography sx={{ ...bFont, fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{item.label}</Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default MentorViewStudentResults;