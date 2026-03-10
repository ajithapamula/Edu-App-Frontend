import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Alert,
  Button,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  TrendingUpOutlined,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PersonOutlined,
  AssignmentOutlined,
  SchoolOutlined,
  EmojiEventsOutlined,
  TimelineOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import studentResultsService from '../../../services/API/studentresults';

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
const ViewResultsShimmer = () => (
  <Box>
    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
      <Skeleton variant="circular" width={34} height={34} />
      <Skeleton variant="text" width={280} height={36} />
    </Box>
    <Box sx={{ p: 3, mb: 3, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Skeleton variant="circular" width={64} height={64} />
        <Box>
          <Skeleton variant="text" width={200} height={28} />
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '6px', mt: 0.5 }} />
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
    <Box sx={{ p: 3, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(41,128,185,0.08)' }}>
      <Skeleton variant="text" width={250} height={28} sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} md={6} key={i}>
            <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '12px' }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  </Box>
);

const ViewStudentResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (id) fetchStudentData(); }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studentResultsService.getAllStudentResults();
      if (response.success && response.data) {
        const student = response.data.find((s) => s.Student_ID === parseInt(id));
        if (student) { setStudentData(student); } else { setError('Student not found'); }
      } else { setError(response.error || 'Failed to fetch student data'); }
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to fetch student data');
    } finally { setLoading(false); }
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
    if (n >= 90) return 'Outstanding';
    if (n >= 80) return 'Excellent';
    if (n >= 70) return 'Good';
    if (n >= 60) return 'Satisfactory';
    if (n > 0) return 'Needs Improvement';
    return 'No Data';
  };

  const getOverallStatus = (student) => {
    const avg = (
      parseFloat(student.Avg_Attendance_Percentage) +
      parseFloat(student.Overall_Mock_Test_Percentage) +
      parseFloat(student.Overall_Mock_Interview_Percentage) +
      parseFloat(student.Overall_Standup_Call_Percentage)
    ) / 4;
    if (avg >= 85) return { status: 'Outstanding Performance', color: '#0d9488', bg: 'rgba(13,148,136,0.10)' };
    if (avg >= 75) return { status: 'Excellent Progress', color: '#2980b9', bg: 'rgba(41,128,185,0.10)' };
    if (avg >= 65) return { status: 'Good Development', color: '#d97706', bg: 'rgba(217,119,6,0.10)' };
    if (avg >= 50) return { status: 'Satisfactory', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' };
    return { status: 'Needs Improvement', color: '#dc2626', bg: 'rgba(220,38,38,0.10)' };
  };

  if (loading) return <ViewResultsShimmer />;

  if (error || !studentData) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', boxShadow: '0 4px 16px rgba(239,68,68,0.10)' }}>
          {error || 'Student not found'}
          <Button color="inherit" size="small" onClick={fetchStudentData} sx={{ ml: 1, fontWeight: 600 }}>Retry</Button>
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

  const overallStatus = getOverallStatus(studentData);
  const averageScore = (
    (parseFloat(studentData.Avg_Attendance_Percentage) +
     parseFloat(studentData.Overall_Mock_Test_Percentage) +
     parseFloat(studentData.Overall_Mock_Interview_Percentage) +
     parseFloat(studentData.Overall_Standup_Call_Percentage)) / 4
  ).toFixed(1);

  const bestScore = Math.max(
    parseFloat(studentData.Avg_Attendance_Percentage),
    parseFloat(studentData.Overall_Mock_Test_Percentage),
    parseFloat(studentData.Overall_Mock_Interview_Percentage),
    parseFloat(studentData.Overall_Standup_Call_Percentage)
  ).toFixed(1);

  const metrics = [
    { label: 'Attendance', value: studentData.Avg_Attendance_Percentage, gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', icon: <PersonOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
    { label: 'Mock Tests', value: studentData.Overall_Mock_Test_Percentage, gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', icon: <AssignmentOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
    { label: 'Mock Interviews', value: studentData.Overall_Mock_Interview_Percentage, gradient: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)', icon: <SchoolOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
    { label: 'Standup Calls', value: studentData.Overall_Standup_Call_Percentage, gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', icon: <TimelineOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
  ];

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
            <TrendingUpOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
              Student Performance
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: fontStack }}>
              Comprehensive performance analysis
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Download Report">
            <IconButton sx={{ width: 34, height: 34, borderRadius: '9px', color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton sx={{ width: 34, height: 34, borderRadius: '9px', color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(41,128,185,0.12)', transform: 'scale(1.05)' } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Student Profile Card */}
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
            {studentData.Student_Name?.charAt(0) || 'S'}
          </Avatar>
          <Box flex={1}>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack, mb: 0.3 }}>
              {studentData.Student_Name}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: fontStack, mb: 0.8 }}>
              Student ID: {studentData.Student_ID}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={overallStatus.status}
                size="small"
                sx={{
                  height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px',
                  fontFamily: fontStack, bgcolor: overallStatus.bg, color: overallStatus.color,
                }}
              />
              <Chip
                label={`Avg: ${averageScore}%`}
                size="small"
                sx={{
                  height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px',
                  fontFamily: fontStack, bgcolor: getScoreBg(averageScore), color: getScoreColor(averageScore),
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'rgba(41,128,185,0.08)', mb: 3 }} />

        {/* Metric Stat Cards */}
        <Grid container spacing={2}>
          {metrics.map((m) => (
            <Grid item xs={12} sm={6} md={3} key={m.label}>
              <StatCard icon={m.icon} label={m.label} value={`${m.value}%`} gradient={m.gradient} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Performance Analysis */}
      <Box
        sx={{
          p: 3, mb: 3, borderRadius: '16px', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <Box
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <TrendingUpOutlined sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
            Detailed Performance Analysis
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {metrics.map((m) => (
            <Grid item xs={12} md={6} key={m.label}>
              <Box
                sx={{
                  p: 2.5, borderRadius: '12px',
                  border: '1px solid rgba(41,128,185,0.08)',
                  bgcolor: '#fafbfc',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: '#f1f5f9', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(26,82,118,0.06)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: fontStack }}>
                    {m.label} Performance
                  </Typography>
                  <Chip
                    label={`${m.value}%`}
                    size="small"
                    sx={{
                      height: 24, fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px',
                      fontFamily: fontStack, bgcolor: getScoreBg(m.value), color: getScoreColor(m.value),
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(m.value)}
                  sx={{
                    height: 8, borderRadius: 4, bgcolor: 'rgba(41,128,185,0.08)',
                    mb: 1,
                    '& .MuiLinearProgress-bar': { borderRadius: 4, background: m.gradient },
                  }}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                    {getPerformanceLabel(m.value)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: fontStack }}>
                    Target: 80%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Performance Summary */}
      <Box
        sx={{
          borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff',
          border: '1px solid rgba(41,128,185,0.08)',
          boxShadow: '0 1px 3px rgba(26,82,118,0.04), 0 4px 20px rgba(26,82,118,0.03)',
        }}
      >
        <Box
          sx={{
            p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: '1px solid rgba(41,128,185,0.08)',
          }}
        >
          <Box
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <EmojiEventsOutlined sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack }}>
            Performance Summary & Insights
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {[
              { label: 'Student ID', value: studentData.Student_ID, gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', icon: <PersonOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
              { label: 'Best Performance', value: `${bestScore}%`, gradient: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)', icon: <EmojiEventsOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
              { label: 'Average Score', value: `${averageScore}%`, gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', icon: <AssignmentOutlined sx={{ color: '#fff', fontSize: 20 }} /> },
              { label: 'Overall Status', value: overallStatus.status, gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', icon: <CheckCircleOutlined sx={{ color: '#fff', fontSize: 20 }} />, isChip: true },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.label}>
                <Box
                  sx={{
                    p: 2.5, borderRadius: '14px', textAlign: 'center',
                    border: '1px solid rgba(41,128,185,0.08)',
                    bgcolor: '#fafbfc',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#f1f5f9', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(26,82,118,0.06)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 42, height: 42, borderRadius: '11px', background: item.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5,
                    }}
                  >
                    {item.icon}
                  </Box>
                  {item.isChip ? (
                    <Chip
                      label={item.value}
                      size="small"
                      sx={{
                        height: 24, fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px',
                        fontFamily: fontStack, bgcolor: overallStatus.bg, color: overallStatus.color, mb: 1,
                      }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', fontFamily: fontStack, mb: 0.5 }}>
                      {item.value}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontFamily: fontStack }}>
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default ViewStudentResults;