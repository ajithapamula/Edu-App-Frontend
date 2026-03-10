import React, { useRef, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Button,
  IconButton
} from '@mui/material';
import {
  People,
  Assignment,
  VideoLibrary,
  Description,
  Add as AddIcon,
  EditNote,
  Videocam,
  BarChart,
  ArrowOutward,
  MoreVert,
  Star,
  CalendarMonth
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/* ── Scroll-triggered animation hook ── */
const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

/* ── Animated wrapper component ── */
const AnimatedBox = ({ children, delay = 0, direction = 'up', sx = {}, ...props }) => {
  const [ref, isVisible] = useScrollReveal();

  const translateMap = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)'
  };

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0)' : translateMap[direction],
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

const TrainerDashboard = () => {
  const navigate = useNavigate();

  console.log('TrainerDashboard component rendering');

  const stats = [
    { title: 'TOTAL STUDENTS', value: '45', icon: <People />, iconBg: '#e8f0fe', iconColor: '#1976d2' },
    { title: 'ACTIVE COURSES', value: '8', icon: <Description />, iconBg: '#e0f2f1', iconColor: '#00897b' },
    { title: 'PENDING TASKS', value: '12', icon: <Assignment />, iconBg: '#fff3e0', iconColor: '#f57c00' },
    { title: 'SESSIONS COMPLETED', value: '156', icon: <VideoLibrary />, iconBg: '#f3e5f5', iconColor: '#7b1fa2' }
  ];

  const quickActions = [
    { title: 'Add Course Document', description: 'Upload new course materials', action: () => navigate('/trainer/course-documents/add'), icon: <AddIcon />, iconBg: '#1976d2' },
    { title: 'Create New Task', description: 'Assign new task to students', action: () => navigate('/trainer/tasks/add'), icon: <EditNote />, iconBg: '#00897b' },
    { title: 'Upload Session Recording', description: 'Add new session recording', action: () => navigate('/trainer/session-recordings/add'), icon: <Videocam />, iconBg: '#f57c00' },
    { title: 'View Student Results', description: 'Check student performance', action: () => navigate('/trainer/student-results'), icon: <BarChart />, iconBg: '#7b1fa2' }
  ];

  const recentActivities = [
    { title: 'New student enrolled in Full Stack Development', time: '2 hours ago' },
    { title: 'Trainer Task "Mid-Term Evaluation" completed by 12 students', time: '5 hours ago' },
    { title: 'Session Recording "React Hooks Advanced" uploaded', time: 'Yesterday' },
    { title: 'Mock Test result published for Batch #42B', time: '2 days ago' }
  ];

  const nextSessions = [
    { date: '14', month: 'OCT', title: 'Batch #42A Standup', time: '10:00 AM' },
    { date: '15', month: 'OCT', title: 'Batch #42A Standup', time: '10:00 AM' }
  ];

  const card = {
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', p: { xs: 2, md: 3 }, overflow: 'hidden' }}>

      {/* Header - fade in from left */}
      <AnimatedBox direction="right" delay={0} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#4361ee', fontSize: '1.5rem' }}>
          Trainer Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa' }}>
          Dashboard / Overview
        </Typography>
      </AnimatedBox>

      {/* Stats Row - staggered from bottom */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        {stats.map((stat, i) => (
          <AnimatedBox key={i} delay={0.1 + i * 0.1} direction="up" sx={{ ...card, p: 2.5, position: 'relative', cursor: 'pointer', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease', '&:hover': { transform: 'translateY(-8px) scale(1.02)', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(67,97,238,0.3)' }, '&:hover .stat-icon': { transform: 'scale(1.15)', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' } }}>
            <IconButton size="small" sx={{ position: 'absolute', top: 10, right: 6, color: '#ccc' }}>
              <MoreVert fontSize="small" />
            </IconButton>
            <Box className="stat-icon" sx={{ width: 44, height: 44, borderRadius: '12px', background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: stat.iconColor, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease' }}>
              {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
            </Box>
            <Typography sx={{ color: '#7a7f9a', fontWeight: 600, letterSpacing: '0.08em', fontSize: '0.7rem' }}>
              {stat.title}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#1a1a2e', lineHeight: 1.2, mt: 0.3 }}>
              {stat.value}
            </Typography>
          </AnimatedBox>
        ))}
      </Box>

      {/* Quick Actions - slide up */}
      <AnimatedBox delay={0.1} direction="up" sx={{ ...card, borderRadius: '24px', p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#1a1a2e' }}>Quick Actions</Typography>
          <Button variant="outlined" size="small" sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, borderColor: '#4361ee', color: '#4361ee', px: 2, '&:hover': { background: '#eef1ff', borderColor: '#4361ee' } }}>
            See All
          </Button>
        </Box>
        <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>Manage your trainer workspace efficiently</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5 }}>
          {quickActions.map((action, i) => (
            <AnimatedBox key={i} delay={0.15 + i * 0.1} direction="up" onClick={action.action} sx={{ cursor: 'pointer', p: 3, borderRadius: '20px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease', '&:hover': { transform: 'translateY(-10px) scale(1.03) !important', boxShadow: '0 24px 48px rgba(0,0,0,0.15)', border: '1px solid rgba(67,97,238,0.4)', background: 'rgba(255,255,255,0.9)' }, '&:hover .action-icon': { transform: 'scale(1.15) rotate(-5deg)', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' } }}>
              <Box className="action-icon" sx={{ width: 52, height: 52, borderRadius: '14px', background: action.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: '#fff', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease' }}>
                {React.cloneElement(action.icon, { sx: { fontSize: 26 } })}
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1rem', mb: 0.5 }}>{action.title}</Typography>
              <Typography variant="body2" sx={{ color: '#999', fontSize: '0.85rem' }}>{action.description}</Typography>
            </AnimatedBox>
          ))}
        </Box>
      </AnimatedBox>

      {/* Bottom Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>

        {/* Recent Activity - slide from left */}
        <AnimatedBox direction="left" delay={0.1} sx={{ ...card, borderRadius: '24px', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#1a1a2e' }}>Recent Activity</Typography>
            <Button size="small" sx={{ textTransform: 'none', fontWeight: 600, color: '#4361ee', '&:hover': { background: 'transparent', textDecoration: 'underline' } }}>
              Mark all as read
            </Button>
          </Box>
          {recentActivities.map((a, i) => (
            <AnimatedBox key={i} delay={0.2 + i * 0.1} direction="left" sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, borderBottom: i !== recentActivities.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', borderRadius: '12px', px: 1, mx: -1, transition: 'background 0.2s ease', '&:hover': { background: 'rgba(67,97,238,0.04)' }, '&:hover .activity-circle': { transform: 'scale(1.1)', boxShadow: '0 4px 14px rgba(67,97,238,0.25)' } }}>
              <Box className="activity-circle" sx={{ width: 46, height: 46, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease' }}>
                <ArrowOutward sx={{ fontSize: 20, color: '#4361ee' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem', mb: 0.3 }}>{a.title}</Typography>
                <Typography variant="caption" sx={{ color: '#4361ee', fontWeight: 500, fontSize: '0.78rem' }}>{a.time}</Typography>
              </Box>
            </AnimatedBox>
          ))}
        </AnimatedBox>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Trainer Performance - slide from right */}
          <AnimatedBox direction="right" delay={0.2} sx={{ borderRadius: '24px', background: 'linear-gradient(135deg, #0a2342 0%, #0d7377 60%, #14a3a8 100%)', p: 3, color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 50px rgba(13,115,119,0.35)' } }}>
            <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
              <Star sx={{ color: '#ffd54f', fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', mb: 0.5 }}>Trainer Performance</Typography>
            <Typography sx={{ fontSize: '0.85rem', opacity: 0.85, lineHeight: 1.5, mb: 2 }}>
              Your active engagement in "Daily Standups" has boosted student participation by 24% this month.
            </Typography>
            <Button variant="contained" sx={{ borderRadius: '28px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', background: '#fff', color: '#0a2342', px: 4, py: 1, fontSize: '0.8rem', boxShadow: 'none', alignSelf: 'flex-start', '&:hover': { background: '#f0f0f0', boxShadow: 'none' } }}>
              Full Report
            </Button>
          </AnimatedBox>

          {/* Next Sessions - slide from right */}
          <AnimatedBox direction="right" delay={0.35} sx={{ ...card, borderRadius: '24px', p: 3, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 36px rgba(0,0,0,0.1)' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarMonth sx={{ fontSize: 20, color: '#1a1a2e' }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', color: '#1a1a2e' }}>NEXT SESSIONS</Typography>
            </Box>
            {nextSessions.map((s, i) => (
              <AnimatedBox key={i} delay={0.45 + i * 0.1} direction="right" sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: i !== nextSessions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: '#f44336', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{s.month}</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>{s.date}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{s.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#aaa' }}>{s.time}</Typography>
                </Box>
              </AnimatedBox>
            ))}
          </AnimatedBox>
        </Box>
      </Box>
    </Box>
  );
};

export default TrainerDashboard;