import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Chip,
  Avatar,
  Button,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Assignment,
  VideoLibrary,
  Schedule,
  CheckCircle,
  Notifications,
  Download,
  PlayArrow,
  Star,
  AccessTime,
  School,
  ArrowForward,
  CalendarToday,
  DescriptionOutlined,
  PlayCircleOutline,
  EmojiEvents,
  TimerOutlined,
  Videocam,
  LightbulbOutlined,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../services/API/index';
import DashboardGuide from './DashboardGuide/DashboardGuide';

/* ——— keyframes ——— */
const _dashKf = document.getElementById('dash-keyframes') || (() => {
  const s = document.createElement('style');
  s.id = 'dash-keyframes';
  s.textContent = `
    @keyframes dashFadeUp {
      0%   { opacity: 0; transform: translateY(16px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes progressPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(41,128,185,0.2); }
      50%      { box-shadow: 0 0 0 6px rgba(41,128,185,0); }
    }
    @keyframes liveBlink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.4; }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ——— tokens ——— */
const fontStack = "'Segoe UI', 'Helvetica Neue', sans-serif";

/* Light card with subtle blue border accent */
const cardBase = {
  borderRadius: '18px',
  background: '#fff',
  border: '1px solid rgba(41,128,185,0.08)',
  boxShadow: '0 1px 3px rgba(26,82,118,0.05), 0 4px 20px rgba(26,82,118,0.04)',
  overflow: 'hidden',
  transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  height: '100%',
  '&:hover': {
    boxShadow: '0 4px 24px rgba(26,82,118,0.10), 0 1px 4px rgba(41,128,185,0.06)',
    transform: 'translateY(-1px)',
  },
};

const sectionTitle = {
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#0f172a',
  letterSpacing: '-0.01em',
  fontFamily: fontStack,
  lineHeight: 1.3,
};

const subtleText = {
  fontSize: '0.78rem',
  color: '#64748b',
  fontFamily: fontStack,
};

/* ——— Section header ——— */
const SectionHeader = ({ icon, gradient, title, subtitle, action }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
    <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flex: 1 }}>
      <Box
        sx={{
          width: 34, height: 34, minWidth: 34, borderRadius: '10px',
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {React.cloneElement(icon, { sx: { color: '#fff', fontSize: 17 } })}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={sectionTitle} noWrap>{title}</Typography>
        {subtitle && (
          <Typography sx={{ ...subtleText, fontSize: '0.7rem', lineHeight: 1.2, mt: 0.1 }} noWrap>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {action && (
      <Button
        size="small"
        onClick={action.onClick}
        endIcon={<ArrowForward sx={{ fontSize: '14px !important' }} />}
        sx={{
          textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', color: '#2980b9',
          borderRadius: '8px', px: 1.5, flexShrink: 0, whiteSpace: 'nowrap', ml: 1,
          '&:hover': { bgcolor: 'rgba(41,128,185,0.06)' },
        }}
      >
        {action.label}
      </Button>
    )}
  </Box>
);

/* ——— Score Circle ——— */
const ScoreCircle = ({ grade, size = 52 }) => {
  const getColor = (g) => {
    if (g >= 90) return '#0d9488';
    if (g >= 80) return '#2980b9';
    if (g >= 70) return '#f59e0b';
    return '#ef4444';
  };
  const color = getColor(grade);
  return (
    <Box sx={{ width: size, height: size, minWidth: size, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: color, lineHeight: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>SCORE</Typography>
      <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: color, lineHeight: 1.1 }}>{grade}%</Typography>
    </Box>
  );
};

/* ——— Helper: get student context from localStorage (same pattern as batches.js) ——— */
const getStudentContext = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  const userId = user.id || user.Id || user.ID;
  if (!userId) return null;
  return { userId };
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickTips, setQuickTips] = useState([]);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const mockData = {
      student: {
        name: user?.name || 'Santoshi',
        email: user?.email || 'student@email.com',
        course: 'Full Stack Development',
        batch: 'Batch #42A',
        track: 'Advanced Track',
        avatar: user?.avatar || '',
        progress: 75,
        level: 'Advanced',
        totalHours: 156,
        studyTime: '4.5 / 6 hrs',
        taskRank: '#1 Top Learner',
      },
      stats: {
        tasksCompleted: 12, totalTasks: 18,
        documentsViewed: 24, recordingsWatched: 15, averageGrade: 85,
        ongoing: 3, completed: 6,
      },
      recentTasks: [
        { id: 1, title: 'Build React To-Do App', dueDate: '2024-01-25', status: 'submitted', grade: 88, priority: 'high' },
        { id: 2, title: 'JavaScript ES6 Features Quiz', dueDate: '2024-01-20', status: 'graded', grade: 92, priority: 'medium' },
        { id: 3, title: 'CSS Grid Layout Assignment', dueDate: '2024-01-30', status: 'pending', grade: null, priority: 'high' },
      ],
      recentDocuments: [
        { id: 1, title: 'React Hooks Guide', type: 'PDF', size: '2.4 MB', views: 156 },
        { id: 2, title: 'JavaScript Best Practices', type: 'PDF', size: '1.8 MB', views: 203 },
        { id: 3, title: 'API Design Principles', type: 'DOC', size: '856 KB', views: 98 },
      ],
      recentRecordings: [
        { id: 1, title: 'React Fundamentals - Session 1', duration: '2:30:45', watched: true, progress: 100 },
        { id: 2, title: 'JavaScript Advanced Concepts', duration: '1:45:30', watched: false, progress: 0 },
        { id: 3, title: 'API Integration Workshop', duration: '3:15:20', watched: true, progress: 65 },
      ],
      announcements: [
        { id: 1, title: 'New Assignment: Database Design', message: 'A new assignment has been posted for Backend Development course.', date: '2024-01-22', read: false },
        { id: 2, title: 'Mock Interview Scheduled', message: 'Your mock interview is scheduled for January 25th at 2:00 PM.', date: '2024-01-20', read: true },
      ],
      upcomingEvents: [
        { id: 1, title: 'React Advanced Patterns', type: 'Live Session', date: '2024-01-25', time: '10:00 AM', instructor: 'John Trainer' },
        { id: 2, title: 'Project Review Meeting', type: 'Meeting', date: '2024-01-26', time: '2:00 PM', instructor: 'Sarah Mentor' },
      ],
      liveSession: { title: 'React State & Context API', description: 'Master deep state management with John Walker.', timeUntil: '15M' },
    };
    setTimeout(() => { setDashboardData(mockData); setLoading(false); }, 800);
  }, [user]);

  /* ── Fetch quick tips from API (both trainer and mentor tips) ── */
  useEffect(() => {
    const fetchQuickTips = async () => {
      try {
        const ctx = getStudentContext();
        if (!ctx) return;
        const data = await apiRequest(`/api/student/batch/tip/${ctx.userId}`, {
          method: 'GET',
        });
        if (data.Tips && data.Tips.length > 0) {
          const tips = data.Tips.map((tip) => {
            // ── Use the new API field names: Creator_Name and Creator_Role ──
            const personName = tip.Creator_Name || 'Unknown';
            const nameParts = personName.trim().split(' ');
            const initials = nameParts.length >= 2
              ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
              : personName.substring(0, 2).toUpperCase();

            // Creator_Role comes from API as 'mentor' or 'trainer'
            const role = tip.Creator_Role === 'trainer' ? 'Trainer' : 'Mentor';

            return {
              id: tip.Tip_ID || Math.random(),
              message: tip.Tip_Text,
              name: personName,
              initials: initials,
              role: role,
            };
          });
          setQuickTips(tips);
        }
      } catch (err) {
        console.error('Failed to fetch quick tips:', err);
      }
    };
    fetchQuickTips();
  }, []);

  /* ── Guide: listen for header ? button click ── */
  useEffect(() => {
    const handler = () => setShowGuide(true);
    window.addEventListener('openStudentGuide', handler);
    return () => window.removeEventListener('openStudentGuide', handler);
  }, []);

  /* ── Guide: auto-show on first visit ── */
  useEffect(() => {
    if (!loading) {
      const seen = localStorage.getItem('iMentora_studentTourSeen');
      if (!seen) {
        setTimeout(() => setShowGuide(true), 1200);
      }
    }
  }, [loading]);

  const getStatusChip = (status) => {
    const map = {
      submitted: { label: 'SUBMITTED', bg: 'rgba(41,128,185,0.10)', color: '#2980b9' },
      graded: { label: 'GRADED', bg: 'rgba(13,148,136,0.10)', color: '#0d9488' },
      pending: { label: 'PENDING', bg: 'rgba(245,158,11,0.10)', color: '#f59e0b' },
      overdue: { label: 'OVERDUE', bg: 'rgba(239,68,68,0.10)', color: '#ef4444' },
    };
    const s = map[status] || { label: status.toUpperCase(), bg: 'rgba(148,163,184,0.10)', color: '#94a3b8' };
    return <Chip label={s.label} size="small" sx={{ height: 22, fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.05em', borderRadius: '6px', bgcolor: s.bg, color: s.color }} />;
  };

  const getPriorityChip = (priority) => {
    const map = { high: { color: '#ef4444', border: 'rgba(239,68,68,0.25)' }, medium: { color: '#f59e0b', border: 'rgba(245,158,11,0.25)' }, low: { color: '#2980b9', border: 'rgba(41,128,185,0.25)' } };
    const p = map[priority] || { color: '#94a3b8', border: 'rgba(148,163,184,0.25)' };
    return <Chip label={priority.toUpperCase()} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.05em', borderRadius: '6px', borderColor: p.border, color: p.color }} />;
  };

  /* ── Helper: get role-based colors for tip cards ── */
  const getRoleStyle = (role) => {
    const roleLower = (role || '').toLowerCase();
    if (roleLower === 'trainer') {
      return {
        gradient: 'linear-gradient(135deg, #7b1fa2 0%, #ce93d8 100%)',
        bg: 'rgba(123,31,162,0.04)',
        border: 'rgba(123,31,162,0.08)',
        chipBg: 'rgba(123,31,162,0.10)',
        chipColor: '#7b1fa2',
        label: 'TRAINER',
      };
    }
    return {
      gradient: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)',
      bg: 'rgba(41,128,185,0.04)',
      border: 'rgba(41,128,185,0.08)',
      chipBg: 'rgba(13,148,136,0.10)',
      chipColor: '#0d9488',
      label: 'MENTOR',
    };
  };

  const handleViewTask = (id) => navigate(`/student/tasks/view/${id}`);
  const handleViewDocument = (id) => navigate(`/student/documents/view/${id}`);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column" gap={2}>
        <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'progressPulse 1.5s ease-in-out infinite' }}>
          <School sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography sx={{ ...subtleText, fontSize: '0.88rem' }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  const { student, stats, recentTasks, recentDocuments, recentRecordings, announcements, upcomingEvents, liveSession } = dashboardData;
  const firstName = student.name?.split(' ')[0] || 'Student';

  return (
    <Box sx={{ fontFamily: fontStack, width: '100%', bgcolor: '#f0f4f8', minHeight: '100vh' }}>

      {/* ═══ TOP ROW: Welcome Banner + Live/Schedule ═══ */}
      <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
        {/* Welcome Banner — Left */}
        <Box sx={{ flex: '1 1 65%', minWidth: 0 }}>
          <Box
            data-tour="welcome-banner"
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: '22px',
              background: '#fff',
              border: '1px solid rgba(41,128,185,0.10)',
              boxShadow: '0 2px 16px rgba(26,82,118,0.06)',
              position: 'relative', overflow: 'hidden',
              animation: 'dashFadeUp 0.4s ease-out both',
              height: '100%', minHeight: 220,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}
          >
            <Box sx={{ position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(41,128,185,0.04)', display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{ position: 'absolute', bottom: -40, right: 100, width: 120, height: 120, borderRadius: '50%', background: 'rgba(13,148,136,0.04)', display: { xs: 'none', sm: 'block' } }} />

            <Box position="relative" zIndex={1}>
              <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#2980b9', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Student Profile</Typography>
                <Box sx={{ width: 30, height: 1, bgcolor: 'rgba(41,128,185,0.25)' }} />
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{student.batch} • {student.track}</Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={2.5}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar src={student.avatar} sx={{ width: { xs: 56, sm: 72 }, height: { xs: 56, sm: 72 }, fontSize: '1.6rem', fontWeight: 700, background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #0d9488 100%)', color: '#fff', border: '3px solid rgba(41,128,185,0.15)', flexShrink: 0 }}>
                    {student.name?.charAt(0)?.toUpperCase() || 'S'}
                  </Avatar>
                  <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', bgcolor: '#0d9488', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star sx={{ fontSize: 12, color: '#fff' }} />
                  </Box>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', sm: '1.8rem' }, background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Hey {firstName},</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', sm: '1.8rem' }, background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: 1.15 }}>let's crush your goals</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', sm: '1.8rem' }, background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 40%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', lineHeight: 1.15 }}>today!</Typography>
                </Box>

                {/* Daily Focus Panel */}
                <Box data-tour="daily-focus" sx={{ display: { xs: 'none', md: 'block' }, minWidth: 200, p: 2, borderRadius: '16px', bgcolor: 'rgba(41,128,185,0.05)', border: '1px solid rgba(41,128,185,0.10)' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={0.6}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#0d9488', boxShadow: '0 0 6px rgba(13,148,136,0.4)' }} />
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#0d9488', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Daily Focus</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{student.progress}% Complete</Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 10, bgcolor: 'rgba(41,128,185,0.10)', overflow: 'hidden', mb: 1.5 }}>
                    <Box sx={{ height: '100%', width: `${student.progress}%`, borderRadius: 10, background: 'linear-gradient(90deg, #2980b9 0%, #0d9488 60%, #5eead4 100%)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Study Time</Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{student.studyTime}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Task Rank</Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#2980b9' }}>{student.taskRank}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box display="flex" gap={1.5} mt={2.5} position="relative" zIndex={1} flexWrap="wrap">
              <Button startIcon={<PlayArrow sx={{ fontSize: '18px !important' }} />} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', color: '#fff', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', borderRadius: '10px', px: 2.5, py: 1, boxShadow: '0 4px 12px rgba(41,128,185,0.25)', '&:hover': { boxShadow: '0 6px 18px rgba(41,128,185,0.35)' } }}>
                Resume: React Hooks
              </Button>
              <Button endIcon={<ArrowForward sx={{ fontSize: '16px !important' }} />} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)', borderRadius: '10px', px: 2.5, py: 1, border: '1px solid rgba(41,128,185,0.15)', '&:hover': { bgcolor: 'rgba(41,128,185,0.10)' } }}>
                View My Roadmap
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Right Cards: Live Session + Schedule */}
        <Box sx={{ flex: '1 1 35%', minWidth: 0 }}>
          <Box display="flex" flexDirection="column" gap={2.5} sx={{ height: '100%' }}>
            <Card data-tour="live-session" sx={{ ...cardBase, flex: 1, animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.15s' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box display="flex" alignItems="center" gap={0.8} mb={1.5}>
                  <Videocam sx={{ fontSize: 16, color: '#ef4444' }} />
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase', animation: 'liveBlink 2s ease-in-out infinite' }}>Live in {liveSession.timeUntil}</Typography>
                </Box>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', mb: 0.5, lineHeight: 1.3 }}>{liveSession.title}</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mb: 2, lineHeight: 1.5 }}>{liveSession.description}</Typography>
                <Button endIcon={<ArrowForward sx={{ fontSize: '16px !important' }} />}
                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', color: '#fff', background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', borderRadius: '10px', px: 2.5, py: 0.9, width: '100%', '&:hover': { opacity: 0.9 } }}>
                  Join Room
                </Button>
              </CardContent>
            </Card>

            <Box sx={{ p: 2.5, borderRadius: '18px', background: 'linear-gradient(135deg, rgba(41,128,185,0.08) 0%, rgba(13,148,136,0.06) 100%)', border: '1px solid rgba(41,128,185,0.10)', animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.25s', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:hover': { borderColor: 'rgba(41,128,185,0.20)' } }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ width: 42, height: 42, borderRadius: '12px', background: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarToday sx={{ fontSize: 20, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#2980b9', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Schedule</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Full Calendar</Typography>
                </Box>
              </Box>
              <ArrowForward sx={{ fontSize: 20, color: '#94a3b8' }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ═══ Stat Cards ═══ */}
      <Grid container spacing={2} sx={{ mb: 2.5 }} data-tour="stats-row">
        {[
          { icon: <CheckCircle />, value: `${stats.tasksCompleted}/${stats.totalTasks}`, label: 'Tasks Done', gradient: 'linear-gradient(135deg, #0d9488 0%, #5eead4 100%)', delay: '0.1s' },
          { icon: <EmojiEvents />, value: `${stats.averageGrade}%`, label: 'Avg Grade', gradient: 'linear-gradient(135deg, #2980b9 0%, #3498c8 100%)', delay: '0.15s' },
          { icon: <PlayCircleOutline />, value: `${stats.recordingsWatched}`, label: 'Videos Watched', gradient: 'linear-gradient(135deg, #3498c8 0%, #2db5a0 100%)', delay: '0.2s' },
          { icon: <TimerOutlined />, value: `${student.totalHours}h`, label: 'Study Hours', gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)', delay: '0.25s' },
        ].map((stat) => (
          <Grid item xs={6} sm={6} md={3} key={stat.label}>
            <Box sx={{ animation: 'dashFadeUp 0.5s ease-out both', animationDelay: stat.delay, height: '100%' }}>
              <Card sx={{ ...cardBase, position: 'relative' }}>
                <Box sx={{ height: '3px', background: stat.gradient }} />
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' }, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: fontStack }}>{stat.value}</Typography>
                      <Typography noWrap sx={{ fontSize: { xs: '0.58rem', md: '0.68rem' }, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.8 }}>{stat.label}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: 38, md: 44 }, height: { xs: 38, md: 44 }, minWidth: { xs: 38, md: 44 }, borderRadius: '12px', background: stat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                      {React.cloneElement(stat.icon, { sx: { color: '#fff', fontSize: { xs: 18, md: 22 } } })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ═══ Main Content — forced side by side ═══ */}
      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>

        {/* LEFT COLUMN */}
        <Box sx={{ flex: '1 1 58%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Active Assignments */}
            <Card data-tour="active-assignments" sx={{ ...cardBase, animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.25s' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <SectionHeader
                  icon={<Assignment />}
                  gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)"
                  title="Active Assignments"
                  subtitle={`${String(stats.ongoing).padStart(2, '0')} Ongoing • ${String(stats.completed).padStart(2, '0')} Completed`}
                  action={{ label: 'View All', onClick: () => navigate('/student/tasks') }}
                />
                <List disablePadding>
                  {recentTasks.map((task, i) => (
                    <React.Fragment key={task.id}>
                      <ListItem onClick={() => handleViewTask(task.id)} disableGutters
                        sx={{ px: 1.5, py: 1.8, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 1.5, '&:hover': { bgcolor: 'rgba(41,128,185,0.04)' } }}>
                        <Box sx={{ width: 38, height: 38, minWidth: 38, borderRadius: '50%', bgcolor: task.status === 'graded' ? 'rgba(13,148,136,0.08)' : task.status === 'submitted' ? 'rgba(41,128,185,0.08)' : 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {task.status === 'graded' ? <CheckCircle sx={{ fontSize: 18, color: '#0d9488' }} /> : <Schedule sx={{ fontSize: 18, color: task.status === 'submitted' ? '#2980b9' : '#f59e0b' }} />}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', mb: 0.6 }}>{task.title}</Typography>
                          <Box display="flex" alignItems="center" gap={0.8} flexWrap="wrap">
                            {getStatusChip(task.status)}
                            {getPriorityChip(task.priority)}
                            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</Typography>
                          </Box>
                        </Box>
                        {task.grade ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <ScoreCircle grade={task.grade} />
                            <ChevronRight sx={{ fontSize: 20, color: '#cbd5e1' }} />
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Button size="small" startIcon={<Assignment sx={{ fontSize: '14px !important' }} />}
                              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', color: '#fff', background: 'linear-gradient(135deg, #2980b9 0%, #0d9488 100%)', borderRadius: '8px', px: 1.5, py: 0.5, '&:hover': { opacity: 0.9 } }}
                              onClick={(e) => e.stopPropagation()}>
                              Submit Work
                            </Button>
                            <ChevronRight sx={{ fontSize: 20, color: '#cbd5e1' }} />
                          </Box>
                        )}
                      </ListItem>
                      {i < recentTasks.length - 1 && <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)' }} />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Session Recordings */}
            <Card data-tour="session-recordings" sx={{ ...cardBase, animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.35s' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <SectionHeader icon={<VideoLibrary />} gradient="linear-gradient(135deg, #3498c8 0%, #2db5a0 100%)" title="Session Recordings" action={{ label: 'View All', onClick: () => navigate('/student/recordings') }} />
                <List disablePadding>
                  {recentRecordings.map((rec, i) => (
                    <React.Fragment key={rec.id}>
                      <ListItem disableGutters sx={{ px: 1.5, py: 1.5, borderRadius: '12px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 1.5, '&:hover': { bgcolor: 'rgba(41,128,185,0.04)' } }}>
                        <Box sx={{ width: 42, height: 42, minWidth: 42, borderRadius: '12px', bgcolor: rec.progress === 100 ? 'rgba(13,148,136,0.08)' : 'rgba(41,128,185,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PlayArrow sx={{ fontSize: 22, color: rec.progress === 100 ? '#0d9488' : '#2980b9' }} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography noWrap sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', mb: 0.4 }}>{rec.title}</Typography>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Box display="flex" alignItems="center" gap={0.4}>
                              <AccessTime sx={{ fontSize: 13, color: '#94a3b8' }} />
                              <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{rec.duration}</Typography>
                            </Box>
                            {rec.watched && rec.progress > 0 ? (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Box sx={{ width: 50, height: 4, borderRadius: 2, bgcolor: 'rgba(41,128,185,0.10)', overflow: 'hidden' }}>
                                  <Box sx={{ width: `${rec.progress}%`, height: '100%', borderRadius: 2, bgcolor: rec.progress === 100 ? '#0d9488' : '#2980b9' }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: rec.progress === 100 ? '#0d9488' : '#2980b9' }}>{rec.progress}%</Typography>
                              </Box>
                            ) : (
                              <Chip label="NEW" size="small" sx={{ height: 20, fontSize: '0.55rem', fontWeight: 700, borderRadius: '5px', bgcolor: 'rgba(41,128,185,0.10)', color: '#2980b9' }} />
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                      {i < recentRecordings.length - 1 && <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)' }} />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Quick Tips — shows ALL tips from both trainers and mentors */}
            {quickTips.length > 0 && (
              <Box data-tour="quick-tips" sx={{ display: 'flex', flexDirection: 'column', gap: 2, animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.45s' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <LightbulbOutlined sx={{ fontSize: 18, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Quick Tips</Typography>
                  <Chip
                    label={quickTips.length}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.55rem', fontWeight: 700,
                      borderRadius: '5px', bgcolor: 'rgba(41,128,185,0.10)', color: '#2980b9',
                    }}
                  />
                </Box>
                {quickTips.map((tip, index) => {
                  const roleStyle = getRoleStyle(tip.role);
                  return (
                    <Box
                      key={tip.id || index}
                      sx={{
                        p: 3,
                        borderRadius: '18px',
                        bgcolor: roleStyle.bg,
                        border: `1px solid ${roleStyle.border}`,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.7, fontStyle: 'italic', mb: 2 }}>
                        "{tip.message}"
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{
                          width: 30, height: 30, fontSize: '0.65rem', fontWeight: 700,
                          background: roleStyle.gradient, color: '#fff',
                        }}>
                          {tip.initials}
                        </Avatar>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                          {tip.name}
                        </Typography>
                        <Chip
                          label={roleStyle.label}
                          size="small"
                          sx={{
                            height: 20, fontSize: '0.52rem', fontWeight: 700,
                            letterSpacing: '0.08em', borderRadius: '5px',
                            bgcolor: roleStyle.chipBg, color: roleStyle.chipColor,
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
        </Box>

        {/* RIGHT COLUMN */}
        <Box sx={{ flex: '1 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Upcoming */}
            <Card data-tour="upcoming-events" sx={{ ...cardBase, animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.3s' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <SectionHeader icon={<CalendarToday />} gradient="linear-gradient(135deg, #0d9488 0%, #5eead4 100%)" title="Upcoming" />
                <Box display="flex" flexDirection="column" gap={1.2}>
                  {upcomingEvents.map((event) => (
                    <Box key={event.id} sx={{ p: 2, borderRadius: '14px', border: '1px solid rgba(41,128,185,0.08)', bgcolor: 'rgba(41,128,185,0.02)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(41,128,185,0.05)', borderColor: 'rgba(41,128,185,0.15)' } }}>
                      <Typography noWrap sx={{ fontSize: '0.88rem', fontWeight: 650, color: '#0f172a', mb: 0.5 }}>{event.title}</Typography>
                      <Box display="flex" alignItems="center" gap={0.8} flexWrap="wrap">
                        <Chip label={event.type.toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.55rem', fontWeight: 700, borderRadius: '5px', bgcolor: event.type === 'Live Session' ? 'rgba(13,148,136,0.10)' : 'rgba(41,128,185,0.10)', color: event.type === 'Live Session' ? '#0d9488' : '#2980b9' }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>{event.instructor}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.4} mt={0.8}>
                        <Schedule sx={{ fontSize: 13, color: '#94a3b8' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{new Date(event.date).toLocaleDateString()} at {event.time}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card data-tour="announcements" sx={{ ...cardBase, animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.35s' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <SectionHeader icon={<Notifications />} gradient="linear-gradient(135deg, #1a5276 0%, #2980b9 100%)" title="Announcements" />
                <Box display="flex" flexDirection="column" gap={0}>
                  {announcements.map((a, i) => (
                    <React.Fragment key={a.id}>
                      <Box sx={{ py: 1.2 }}>
                        <Box display="flex" alignItems="flex-start" gap={1} mb={0.3}>
                          <Typography sx={{ fontSize: '0.84rem', fontWeight: a.read ? 500 : 700, color: '#0f172a', flex: 1, lineHeight: 1.4 }}>{a.title}</Typography>
                          {!a.read && <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, mt: 0.6, background: 'linear-gradient(135deg, #2980b9, #0d9488)', boxShadow: '0 0 6px rgba(41,128,185,0.4)' }} />}
                        </Box>
                        <Typography sx={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.5, mb: 0.3 }}>{a.message}</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{new Date(a.date).toLocaleDateString()}</Typography>
                      </Box>
                      {i < announcements.length - 1 && <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)' }} />}
                    </React.Fragment>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card data-tour="documents" sx={{ ...cardBase, animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.4s' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <SectionHeader icon={<DescriptionOutlined />} gradient="linear-gradient(135deg, #2980b9 0%, #3498c8 100%)" title="Documents" action={{ label: 'All', onClick: () => navigate('/student/documents') }} />
                <Box display="flex" flexDirection="column" gap={0}>
                  {recentDocuments.map((doc, i) => (
                    <React.Fragment key={doc.id}>
                      <Box onClick={() => handleViewDocument(doc.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 1.2, py: 1.2, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(41,128,185,0.04)' } }}>
                        <Box sx={{ width: 38, height: 38, minWidth: 38, borderRadius: '10px', bgcolor: doc.type === 'PDF' ? 'rgba(239,68,68,0.08)' : 'rgba(41,128,185,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Typography sx={{ fontSize: '0.56rem', fontWeight: 800, color: doc.type === 'PDF' ? '#ef4444' : '#2980b9' }}>{doc.type}</Typography>
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{doc.title}</Typography>
                          <Typography sx={{ fontSize: '0.66rem', color: '#94a3b8', mt: 0.2 }}>{doc.size} • {doc.views} views</Typography>
                        </Box>
                        <IconButton size="small" onClick={(e) => e.stopPropagation()} sx={{ color: '#94a3b8', width: 30, height: 30, flexShrink: 0, '&:hover': { color: '#2980b9', bgcolor: 'rgba(41,128,185,0.06)' } }}>
                          <Download sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                      {i < recentDocuments.length - 1 && <Divider sx={{ borderColor: 'rgba(41,128,185,0.06)' }} />}
                    </React.Fragment>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Student Support */}
            <Box data-tour="student-support" sx={{ p: 3, borderRadius: '18px', background: 'linear-gradient(135deg, #0a1f3d 0%, #153d6b 50%, #187d72 100%)', animation: 'dashFadeUp 0.5s ease-out both', animationDelay: '0.5s' }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#5eead4', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.8 }}>Student Support</Typography>
              <Typography sx={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.70)', lineHeight: 1.5, mb: 2 }}>Stuck on a concept? Our technical team and community are ready to help.</Typography>
              <Button fullWidth sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', color: '#fff', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '10px', py: 1.2, mb: 1, border: '1px solid rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' } }}>
                Join Discord Community
              </Button>
              <Button fullWidth sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', color: '#1a5276', bgcolor: '#5eead4', borderRadius: '10px', py: 1.2, '&:hover': { bgcolor: '#99f6e4' } }}>
                Ask a Question
              </Button>
            </Box>
          </Box>
        </Box>

      {/* ── Dashboard Guide Tour ── */}
      <DashboardGuide run={showGuide} onFinish={() => setShowGuide(false)} />
    </Box>
  );
};

export default StudentDashboard;