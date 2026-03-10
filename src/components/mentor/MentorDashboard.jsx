import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar
} from '@mui/material';
import {
  People,
  Assignment,
  CheckCircle,
  Pending,
  TrendingUp,
  Schedule,
  LightbulbOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiRequest } from '../../services/API/index';
import { mentorBatchesAPI } from '../../services/API/batches';

/* ── keyframe animations injected once ── */
const styleTag = document.getElementById('mentor-dash-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'mentor-dash-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

    @keyframes mentorFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes mentorProgressFill {
      from { width: 0%; }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ── Helper: get mentor context from localStorage ── */
const getMentorContext = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  const userId = user.id || user.Id || user.ID;
  if (!userId) return null;
  return { userId };
};

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [trainerTips, setTrainerTips] = useState([]);

  /* ── Fetch trainer quick tips from API ── */
  useEffect(() => {
    const fetchTrainerTips = async () => {
      try {
        const ctx = getMentorContext();
        if (!ctx) return;

        // Step 1: Get all batches assigned to this mentor
        const batchData = await mentorBatchesAPI.getAll();
        const batches = batchData.Batches || batchData.batches || [];
        if (batches.length === 0) return;

        // Step 2: For each batch, fetch trainer tips
        const allTips = [];
        for (const batch of batches) {
          const batchId = batch.Batch_ID || batch.ID || batch.id;
          const batchCode = batch.Batch_Code || batch.batch_code || '';
          if (!batchId) continue;

          try {
            const tipData = await apiRequest(
              `/api/mentor/batch/trainer-tips/${ctx.userId}/${batchId}`,
              { method: 'GET' }
            );
            if (tipData.Tips && tipData.Tips.length > 0) {
              tipData.Tips.forEach((tip) => {
                const trainerName = tip.Trainer_Name || tip.Creator_Name || 'Trainer';
                const nameParts = trainerName.trim().split(' ');
                const initials = nameParts.length >= 2
                  ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                  : trainerName.substring(0, 2).toUpperCase();
                allTips.push({
                  id: tip.Tip_ID || Math.random(),
                  message: tip.Tip_Text,
                  name: trainerName,
                  initials: initials,
                  batchCode: tipData.Batch_Code || batchCode,
                });
              });
            }
          } catch (batchErr) {
            console.error(`Failed to fetch trainer tips for batch ${batchId}:`, batchErr);
          }
        }

        setTrainerTips(allTips);
      } catch (err) {
        console.error('Failed to fetch trainer tips:', err);
      }
    };
    fetchTrainerTips();
  }, []);

  const stats = [
    {
      title: 'Students Assigned',
      value: '12',
      icon: <People />,
      color: '#1e3a8a'
    },
    {
      title: 'Pending Reviews',
      value: '8',
      icon: <Pending />,
      color: '#f57c00'
    },
    {
      title: 'Completed Reviews',
      value: '45',
      icon: <CheckCircle />,
      color: '#0d9488'
    },
    {
      title: 'Average Score',
      value: '8.5',
      icon: <TrendingUp />,
      color: '#7b1fa2'
    }
  ];

  const pendingSubmissions = [
    {
      id: 1,
      student: 'Alice Johnson',
      task: 'React Component Design',
      course: 'Full Stack Development',
      submittedDate: '2024-01-20',
      dueDate: '2024-01-22',
      priority: 'High'
    },
    {
      id: 2,
      student: 'Bob Smith',
      task: 'Database Schema',
      course: 'Backend Development',
      submittedDate: '2024-01-19',
      dueDate: '2024-01-21',
      priority: 'Medium'
    },
    {
      id: 3,
      student: 'Charlie Brown',
      task: 'API Integration',
      course: 'Full Stack Development',
      submittedDate: '2024-01-18',
      dueDate: '2024-01-20',
      priority: 'High'
    }
  ];

  const studentProgress = [
    {
      student: 'Alice Johnson',
      course: 'Full Stack Development',
      progress: 85,
      tasksCompleted: 15,
      totalTasks: 18,
      lastActivity: '2 hours ago'
    },
    {
      student: 'Bob Smith',
      course: 'Backend Development',
      progress: 72,
      tasksCompleted: 12,
      totalTasks: 16,
      lastActivity: '1 day ago'
    },
    {
      student: 'Charlie Brown',
      course: 'Full Stack Development',
      progress: 91,
      tasksCompleted: 16,
      totalTasks: 18,
      lastActivity: '4 hours ago'
    },
    {
      student: 'Diana Prince',
      course: 'Frontend Development',
      progress: 68,
      tasksCompleted: 10,
      totalTasks: 14,
      lastActivity: '3 hours ago'
    }
  ];

  const recentActivities = [
    {
      title: 'Reviewed submission from Alice Johnson',
      time: '1 hour ago',
      type: 'review'
    },
    {
      title: 'Added feedback for React Components task',
      time: '3 hours ago',
      type: 'feedback'
    },
    {
      title: 'Scheduled mock interview with Bob Smith',
      time: '5 hours ago',
      type: 'interview'
    },
    {
      title: 'Updated task rubric for Database Design',
      time: '1 day ago',
      type: 'update'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  /* ── Shared Style Tokens ── */
  const cardStyle = {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e8ecf2',
    boxShadow: '0 2px 12px rgba(30,58,138,0.06)',
    transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
    '&:hover': {
      boxShadow: '0 6px 24px rgba(30,58,138,0.10)',
      transform: 'translateY(-2px)',
    },
  };

  const paperStyle = {
    ...cardStyle,
    p: 3,
  };

  const accentBtn = {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)',
    color: '#fff',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'none',
    borderRadius: '10px',
    px: 2.5,
    py: 0.8,
    boxShadow: '0 4px 14px rgba(14,165,233,0.25)',
    border: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
      boxShadow: '0 6px 20px rgba(14,165,233,0.30)',
      transform: 'translateY(-1px)',
    },
  };

  const outlineBtn = {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'none',
    borderRadius: '10px',
    border: '1.5px solid rgba(14,165,233,0.30)',
    color: '#0ea5e9',
    px: 2,
    py: 0.7,
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(14,165,233,0.06)',
      borderColor: '#0ea5e9',
      transform: 'translateY(-1px)',
    },
  };

  const headingFont = {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  };

  const bodyFont = {
    fontFamily: '"DM Sans", sans-serif',
    color: '#475569',
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      review: <CheckCircle sx={{ fontSize: 18 }} />,
      feedback: <Assignment sx={{ fontSize: 18 }} />,
      interview: <Schedule sx={{ fontSize: 18 }} />,
      update: <TrendingUp sx={{ fontSize: 18 }} />,
    };
    return iconMap[type] || <Assignment sx={{ fontSize: 18 }} />;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      review: '#0d9488',
      feedback: '#0ea5e9',
      interview: '#1e3a8a',
      update: '#7b1fa2',
    };
    return colorMap[type] || '#0ea5e9';
  };

  const getProgressColor = (progress) => {
    if (progress >= 85) return '#0d9488';
    if (progress >= 70) return '#0ea5e9';
    return '#f57c00';
  };

  const getAvatarGradient = (name) => {
    const gradients = [
      'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
      'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)',
      'linear-gradient(135deg, #172554 0%, #0284c7 100%)',
      'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const quickActions = [
    { label: 'Review Submissions', icon: <Assignment />, nav: '/mentor/task-submissions', gradient: 'linear-gradient(135deg, #1e3a8a, #0ea5e9)' },
    { label: 'Schedule Interview', icon: <Schedule />, nav: '/mentor/mock-interviews', gradient: 'linear-gradient(135deg, #0d9488, #5eead4)' },
    { label: 'Student Analytics', icon: <People />, nav: '/mentor/student-results', gradient: 'linear-gradient(135deg, #172554, #0284c7)' },
    { label: 'Add Resource', icon: <CheckCircle />, nav: '/mentor/course-documents/add', gradient: 'linear-gradient(135deg, #0ea5e9, #0d9488)' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: '#f1f5f9',
        p: { xs: 2, sm: 2.5, md: 3 },
        boxSizing: 'border-box',
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          mb: 3,
          animation: 'mentorFadeUp 0.5s ease-out both',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
          }}>
            <Assignment sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{
              ...headingFont,
              fontSize: { xs: '1.4rem', md: '1.65rem' },
              color: '#0f172a',
              lineHeight: 1.2,
            }}>
              Mentor Dashboard
            </Typography>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              color: '#64748b',
              fontSize: '0.85rem',
              mt: 0.2,
            }}>
              Track progress, review submissions & guide your students
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── STAT CARDS ── */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 2.5,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}>
        {stats.map((stat, index) => (
          <Card
            key={index}
            elevation={0}
            sx={{
              ...cardStyle,
              flex: { xs: '1 1 calc(50% - 8px)', md: '1 1 0' },
              minWidth: 0,
              animation: `mentorFadeUp 0.45s ease-out ${0.08 + index * 0.06}s both`,
              overflow: 'visible',
              position: 'relative',
            }}
          >
            <CardContent sx={{ p: '18px !important' }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    mb: 0.8,
                  }}>
                    {stat.title}
                  </Typography>
                  <Typography sx={{
                    ...headingFont,
                    fontSize: '1.85rem',
                    lineHeight: 1,
                    color: stat.color,
                  }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: `${stat.color}0D`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: stat.color,
                  flexShrink: 0,
                }}>
                  {React.cloneElement(stat.icon, { sx: { fontSize: 22 } })}
                </Box>
              </Box>
              <Box sx={{
                position: 'absolute', bottom: 0, left: 16, right: 16,
                height: 3, borderRadius: '3px 3px 0 0',
                background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                opacity: 0.4,
              }} />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── PENDING TASK REVIEWS — full width ── */}
      <Paper
        elevation={0}
        sx={{
          ...paperStyle,
          mb: 2.5,
          animation: 'mentorFadeUp 0.5s ease-out 0.35s both',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'rgba(14,165,233,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Pending sx={{ color: '#0ea5e9', fontSize: 19 }} />
            </Box>
            <Typography sx={{ ...headingFont, fontSize: '1.05rem' }}>
              Pending Task Reviews
            </Typography>
            <Chip
              label={pendingSubmissions.length}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
                color: '#fff',
              }}
            />
          </Box>
          <Button
            variant="contained"
            disableElevation
            size="small"
            onClick={() => navigate('/mentor/task-submissions')}
            sx={accentBtn}
          >
            View All
          </Button>
        </Box>

        <TableContainer sx={{
          borderRadius: '10px',
          border: '1px solid #e8ecf2',
          overflow: 'hidden',
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Student', 'Task', 'Course', 'Submitted', 'Priority', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.73rem',
                    color: '#1e3a8a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: '2px solid #e8ecf2',
                    py: 1.4,
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingSubmissions.map((submission) => (
                <TableRow
                  key={submission.id}
                  sx={{
                    transition: 'background 0.2s ease',
                    '&:hover': { background: '#f8fafc' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{
                        width: 32, height: 32,
                        fontSize: '0.72rem',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontWeight: 700,
                        background: getAvatarGradient(submission.student),
                      }}>
                        {getInitials(submission.student)}
                      </Avatar>
                      <Typography sx={{
                        ...bodyFont,
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        color: '#0f172a',
                      }}>
                        {submission.student}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                    <Typography sx={{ ...bodyFont, fontSize: '0.84rem', fontWeight: 500 }}>
                      {submission.task}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                    <Chip
                      label={submission.course}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.71rem',
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 500,
                        background: '#f0f4ff',
                        color: '#1e3a8a',
                        border: '1px solid #dbeafe',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                    <Typography sx={{ ...bodyFont, fontSize: '0.82rem', color: '#64748b' }}>
                      {submission.submittedDate}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                    <Chip
                      label={submission.priority}
                      size="small"
                      color={getPriorityColor(submission.priority)}
                      sx={{
                        height: 24,
                        fontSize: '0.71rem',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 1.6 }}>
                    <Button
                      size="small"
                      disableElevation
                      onClick={() => navigate(`/mentor/task-submissions/view/${submission.id}`)}
                      sx={outlineBtn}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── STUDENT PROGRESS — full width ── */}
      <Paper
        elevation={0}
        sx={{
          ...paperStyle,
          mb: 2.5,
          animation: 'mentorFadeUp 0.5s ease-out 0.45s both',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'rgba(13,148,136,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp sx={{ color: '#0d9488', fontSize: 19 }} />
            </Box>
            <Typography sx={{ ...headingFont, fontSize: '1.05rem' }}>
              Student Progress Overview
            </Typography>
          </Box>
          <Button
            variant="contained"
            disableElevation
            size="small"
            onClick={() => navigate('/mentor/student-results')}
            sx={accentBtn}
          >
            View Details
          </Button>
        </Box>

        <Box sx={{
          display: 'flex',
          gap: 2,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}>
          {/* Left column - 2 students */}
          <Box sx={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {studentProgress.slice(0, 2).map((student, index) => (
              <Box
                key={index}
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e8ecf2',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#f0f4ff',
                    borderColor: '#bfdbfe',
                    boxShadow: '0 4px 16px rgba(30,58,138,0.06)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{
                      width: 40, height: 40,
                      fontSize: '0.8rem',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 700,
                      background: getAvatarGradient(student.student),
                    }}>
                      {getInitials(student.student)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ ...headingFont, fontSize: '0.9rem', fontWeight: 600 }}>
                        {student.student}
                      </Typography>
                      <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.76rem', color: '#64748b' }}>
                        {student.course}
                      </Typography>
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography sx={{ ...headingFont, fontSize: '1.35rem', lineHeight: 1, color: getProgressColor(student.progress) }}>
                      {student.progress}%
                    </Typography>
                    <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                      {student.tasksCompleted}/{student.totalTasks} tasks
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: '100%', height: 5, borderRadius: 3, background: '#e2e8f0', mb: 1.5, overflow: 'hidden' }}>
                  <Box sx={{
                    width: `${student.progress}%`, height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${getProgressColor(student.progress)}, ${student.progress >= 85 ? '#5eead4' : student.progress >= 70 ? '#bfdbfe' : '#ffb74d'})`,
                    animation: 'mentorProgressFill 1s ease-out both',
                    animationDelay: `${0.5 + index * 0.12}s`,
                  }} />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.74rem', color: '#94a3b8' }}>
                    Last activity: {student.lastActivity}
                  </Typography>
                  <Button size="small" onClick={() => navigate(`/mentor/student-results/view/${student.student}`)}
                    sx={{ ...outlineBtn, fontSize: '0.72rem', px: 1.5, py: 0.3 }}>
                    View Details
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
          {/* Right column - 2 students */}
          <Box sx={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {studentProgress.slice(2, 4).map((student, index) => (
              <Box
                key={index + 2}
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e8ecf2',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#f0f4ff',
                    borderColor: '#bfdbfe',
                    boxShadow: '0 4px 16px rgba(30,58,138,0.06)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{
                      width: 40, height: 40,
                      fontSize: '0.8rem',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 700,
                      background: getAvatarGradient(student.student),
                    }}>
                      {getInitials(student.student)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ ...headingFont, fontSize: '0.9rem', fontWeight: 600 }}>
                        {student.student}
                      </Typography>
                      <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.76rem', color: '#64748b' }}>
                        {student.course}
                      </Typography>
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography sx={{ ...headingFont, fontSize: '1.35rem', lineHeight: 1, color: getProgressColor(student.progress) }}>
                      {student.progress}%
                    </Typography>
                    <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                      {student.tasksCompleted}/{student.totalTasks} tasks
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: '100%', height: 5, borderRadius: 3, background: '#e2e8f0', mb: 1.5, overflow: 'hidden' }}>
                  <Box sx={{
                    width: `${student.progress}%`, height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${getProgressColor(student.progress)}, ${student.progress >= 85 ? '#5eead4' : student.progress >= 70 ? '#bfdbfe' : '#ffb74d'})`,
                    animation: 'mentorProgressFill 1s ease-out both',
                    animationDelay: `${0.5 + (index + 2) * 0.12}s`,
                  }} />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.74rem', color: '#94a3b8' }}>
                    Last activity: {student.lastActivity}
                  </Typography>
                  <Button size="small" onClick={() => navigate(`/mentor/student-results/view/${student.student}`)}
                    sx={{ ...outlineBtn, fontSize: '0.72rem', px: 1.5, py: 0.3 }}>
                    View Details
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* ── QUICK ACTIONS + RECENT ACTIVITIES — side by side using flexbox ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2.5,
          flexDirection: { xs: 'column', md: 'row' },
          animation: 'mentorFadeUp 0.5s ease-out 0.55s both',
        }}
      >
        {/* Quick Actions — left 50% */}
        <Paper
          elevation={0}
          sx={{
            ...paperStyle,
            flex: '1 1 50%',
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'rgba(14,165,233,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Schedule sx={{ color: '#0ea5e9', fontSize: 19 }} />
            </Box>
            <Typography sx={{ ...headingFont, fontSize: '1.05rem' }}>
              Quick Actions
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                fullWidth
                onClick={() => navigate(action.nav)}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  py: 1.5,
                  px: 2,
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e8ecf2',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#f0f4ff',
                    borderColor: '#bfdbfe',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 16px rgba(30,58,138,0.08)',
                  },
                }}
              >
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: action.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.10)',
                  flexShrink: 0,
                }}>
                  {React.cloneElement(action.icon, { sx: { fontSize: 18, color: '#fff' } })}
                </Box>
                {action.label}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* Recent Activities — right 50% */}
        <Paper
          elevation={0}
          sx={{
            ...paperStyle,
            flex: '1 1 50%',
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'rgba(13,148,136,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp sx={{ color: '#0d9488', fontSize: 19 }} />
            </Box>
            <Typography sx={{ ...headingFont, fontSize: '1.05rem' }}>
              Recent Activities
            </Typography>
          </Box>

          <Box>
            {recentActivities.map((activity, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1.8,
                  px: 1.5,
                  mx: -1.5,
                  borderBottom: index !== recentActivities.length - 1
                    ? '1px solid #f1f5f9' : 'none',
                  transition: 'all 0.2s ease',
                  borderRadius: '8px',
                  '&:hover': {
                    background: '#f8fafc',
                  },
                }}
              >
                <Box sx={{
                  width: 34, height: 34, borderRadius: '9px',
                  background: `${getActivityColor(activity.type)}0D`,
                  border: `1px solid ${getActivityColor(activity.type)}1A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: getActivityColor(activity.type),
                  flexShrink: 0,
                  mt: 0.2,
                }}>
                  {getActivityIcon(activity.type)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    lineHeight: 1.45,
                    mb: 0.3,
                  }}>
                    {activity.title}
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    fontWeight: 500,
                  }}>
                    {activity.time}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* ── TRAINER QUICK TIPS — bottom of page, shown only if tips exist ── */}
      {trainerTips.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            ...paperStyle,
            mt: 2.5,
            animation: 'mentorFadeUp 0.5s ease-out 0.6s both',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'rgba(123,31,162,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LightbulbOutlined sx={{ color: '#7b1fa2', fontSize: 19 }} />
            </Box>
            <Typography sx={{ ...headingFont, fontSize: '1.05rem' }}>
              Trainer Quick Tips
            </Typography>
            <Chip
              label={trainerTips.length}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                background: 'linear-gradient(135deg, #7b1fa2, #ce93d8)',
                color: '#fff',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {trainerTips.map((tip, index) => (
              <Box
                key={tip.id || index}
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  background: 'rgba(123,31,162,0.03)',
                  border: '1px solid rgba(123,31,162,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(123,31,162,0.06)',
                    borderColor: 'rgba(123,31,162,0.15)',
                    boxShadow: '0 4px 16px rgba(123,31,162,0.06)',
                  },
                }}
              >
                {tip.batchCode && (
                  <Chip
                    label={tip.batchCode}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      borderRadius: '6px',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      bgcolor: 'rgba(14,165,233,0.08)',
                      color: '#0ea5e9',
                      border: '1px solid rgba(14,165,233,0.15)',
                      mb: 1.5,
                    }}
                  />
                )}
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.92rem',
                  color: '#475569',
                  lineHeight: 1.7,
                  fontStyle: 'italic',
                  mb: 2,
                }}>
                  "{tip.message}"
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{
                    width: 30, height: 30,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    background: 'linear-gradient(135deg, #7b1fa2 0%, #ce93d8 100%)',
                    color: '#fff',
                  }}>
                    {tip.initials}
                  </Avatar>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#64748b',
                  }}>
                    {tip.name}
                  </Typography>
                  <Chip
                    label="TRAINER"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.52rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      borderRadius: '5px',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      bgcolor: 'rgba(123,31,162,0.10)',
                      color: '#7b1fa2',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MentorDashboard;