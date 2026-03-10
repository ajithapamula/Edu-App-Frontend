import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  People,
  Assignment,
  VideoLibrary,
  Description,
  Quiz,
  Analytics,
  MeetingRoom,
  PendingActions,
  VideoCall,
  Star,
  GradingOutlined,
  Groups,
  ExpandLess,
  ExpandMore,
  EmojiEvents,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 260;

const _sidebarKf = document.getElementById('sidebar-keyframes') || (() => {
  const s = document.createElement('style');
  s.id = 'sidebar-keyframes';
  s.textContent = `
    @keyframes sidebarFadeIn {
      0%   { opacity: 0; transform: translateX(-12px); }
      100% { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

const Sidebar = ({ open, onClose, variant: variantProp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const resolvedVariant = variantProp || (isMobile ? 'temporary' : 'permanent');

  const [resultsOpen, setResultsOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/student/results')) {
      setResultsOpen(true);
    }
  }, [location.pathname]);

  const getMenuGroups = () => {
    switch (user?.role) {
      case 'trainer':
        return [
          { label: 'MAIN', items: [{ text: 'Dashboard', icon: <Dashboard />, path: '/trainer/dashboard' },
            { text: 'Batches', icon: <Groups />, path: '/trainer/batches' },] },
          
          { label: 'LEARNING RESOURCES', items: [
            { text: 'Course Documents', icon: <Description />, path: '/trainer/course-documents' },
            { text: 'Session Recordings', icon: <VideoLibrary />, path: '/trainer/session-recordings' },
          ]},
          { label: 'TASKS & EVALUATION', items: [
            { text: 'Trainer Tasks', icon: <Assignment />, path: '/trainer/tasks' },
            { text: 'Task Reviews', icon: <GradingOutlined />, path: '/trainer/task-reviews' },
            { text: 'Mock Tests', icon: <Quiz />, path: '/trainer/mock-tests' },
            { text: 'Task Results', icon: <Analytics />, path: '/trainer/task-results' },
            { text: 'Student Results', icon: <Analytics />, path: '/trainer/student-results' },
          ]},
          { label: 'ENGAGEMENT', items: [
            { text: 'Mock Interviews', icon: <People />, path: '/trainer/mock-interviews' },
            { text: 'Daily Standups', icon: <PendingActions />, path: '/trainer/daily-standups' },
          ]},
        ];
      case 'mentor':
        return [
          { label: 'MAIN', items: [{ text: 'Dashboard', icon: <Dashboard />, path: '/mentor/dashboard' },
              { text: 'Batches', icon: <Groups />, path: '/mentor/batches' },
          ] },
          { label: 'LEARNING RESOURCES', items: [
            { text: 'Course Documents', icon: <Description />, path: '/mentor/course-documents' },
            { text: 'Session Recordings', icon: <VideoLibrary />, path: '/mentor/session-recordings' },
          ]},
          { label: 'TASKS & EVALUATION', items: [
            { text: 'Trainer Tasks', icon: <Assignment />, path: '/mentor/tasks' },
            { text: 'Task Submissions', icon: <PendingActions />, path: '/mentor/task-submissions' },
            { text: 'Student Results', icon: <Analytics />, path: '/mentor/student-results' },
            { text: 'Mock Tests', icon: <Quiz />, path: '/mentor/mock-tests' },
            { text: 'Task Results', icon: <Analytics />, path: '/mentor/task-results' },
          ]},
          { label: 'ENGAGEMENT', items: [
            { text: 'Mock Interviews', icon: <People />, path: '/mentor/mock-interviews' },
            { text: 'Daily Standups', icon: <PendingActions />, path: '/mentor/daily-standups' },
          ]},
        ];
      case 'student':
      default:
        return [
          { label: 'MAIN', items: [{ text: 'Dashboard', icon: <Dashboard />, path: '/student/dashboard' }] },
          { label: 'LEARNING RESOURCES', items: [
            { text: 'Course Documents', icon: <Description />, path: '/student/course-documents' },
            { text: 'Sessions', icon: <VideoLibrary />, path: '/student/sessions' },
          ]},
          { label: 'TASKS & EVALUATION', items: [
            { text: 'Trainer Tasks', icon: <Assignment />, path: '/student/tasks' },
            { text: 'Task Submissions', icon: <PendingActions />, path: '/student/task-submissions' },
            { text: 'Task Evaluations', icon: <Analytics />, path: '/student/task-evaluations' },
            { text: 'Mock Tests', icon: <Quiz />, path: '/student/mock-tests' },
            {
              text: 'Results',
              icon: <EmojiEvents />,
              isExpandable: true,
              children: [
                { text: 'Daily Standup Results', icon: <Analytics />, path: '/student/results/daily-standups' },
                // { text: 'Mock Test Results', icon: <Analytics />, path: '/student/results/mock-tests' },
                { text: 'Mock Interview Results', icon: <Analytics />, path: '/student/results/mock-interviews' },
              ],
            },
          ]},
          { label: 'ENGAGEMENT', items: [
            { text: 'Mock Interviews', icon: <People />, path: '/student/mock-interviews' },
            { text: 'Daily Standups', icon: <VideoCall />, path: '/student/daily-standups' },
          ]},
        ];
    }
  };

  const menuGroups = getMenuGroups();
  const handleNavClick = (path) => { navigate(path); if (isMobile && onClose) onClose(); };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #3B5998 0%, #2D7DD2 40%, #2980b9 60%, #1A8A8A 85%, #1A8A8A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 68, sm: 76 } }} />
      <Box sx={{ height: { xs: 8, sm: 12 } }} />

      <Box
        data-tour="sidebar-nav"
        sx={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          px: 1.5, pt: 1, pb: 2,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.18)', borderRadius: 10 },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.28)' },
        }}
      >
        {menuGroups.map((group, gIdx) => (
          <Box
            key={group.label}
            sx={{
              mb: 2,
              animation: 'sidebarFadeIn 0.4s ease-out both',
              animationDelay: `${gIdx * 0.08}s`,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.75rem', fontWeight: 800,
                color: 'rgba(255,255,255,0.38)', letterSpacing: '0.14em',
                textTransform: 'uppercase', px: 1.5, mb: 0.8,
                fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
              }}
            >
              {group.label}
            </Typography>

            <List disablePadding>
              {group.items.map((item) => {

                // ─── Expandable parent (Results) ───────────────────────────
                if (item.isExpandable) {
                  const isAnyChildActive = item.children?.some(
                    (child) =>
                      location.pathname === child.path ||
                      location.pathname.startsWith(child.path + '/')
                  );

                  return (
                    <React.Fragment key={item.text}>
                      {/* Parent button — full selected style (box + border) */}
                      <ListItem disablePadding sx={{ mb: 0.2 }}>
                        <ListItemButton
                          selected={isAnyChildActive}
                          onClick={() => setResultsOpen(!resultsOpen)}
                          sx={{
                            borderRadius: '10px', py: 1.1, px: 1.5,
                            transition: 'all 0.2s ease-in-out',
                            '&.Mui-selected': {
                              background: 'rgba(255,255,255,0.18)',
                              borderLeft: '3px solid #fff',
                              '&:hover': { background: 'rgba(255,255,255,0.22)' },
                            },
                            '&:not(.Mui-selected):hover': {
                              bgcolor: 'rgba(255,255,255,0.08)',
                              transform: 'translateX(3px)',
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 36,
                              color: isAnyChildActive ? '#fff' : 'rgba(255,255,255,0.55)',
                              '& .MuiSvgIcon-root': { fontSize: 20 },
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              sx: {
                                fontSize: '0.95rem',
                                fontWeight: isAnyChildActive ? 700 : 600,
                                color: isAnyChildActive ? '#fff' : 'rgba(255,255,255,0.90)',
                                fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                              },
                            }}
                          />
                          {resultsOpen
                            ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 20 }} />
                            : <ExpandMore sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 20 }} />
                          }
                        </ListItemButton>
                      </ListItem>

                      {/* Children — NO box / NO border, only text + icon brightness */}
                      <Collapse in={resultsOpen} timeout="auto" unmountOnExit>
                        <List disablePadding>
                          {item.children.map((child) => {
                            const isChildActive =
                              location.pathname === child.path ||
                              location.pathname.startsWith(child.path + '/');

                            return (
                              <ListItem key={child.text} disablePadding sx={{ mb: 0.2 }}>
                                <ListItemButton
                                  onClick={() => handleNavClick(child.path)}
                                  disableRipple={false}
                                  sx={{
                                    borderRadius: '10px',
                                    py: 0.9,
                                    px: 1.5,
                                    pl: 4.5,
                                    transition: 'all 0.2s ease-in-out',
                                    // FIX: removed background, borderLeft, and Mui-selected styles
                                    // Active child: only text/icon become fully white — no box effect
                                    background: 'transparent !important',
                                    '&:hover': {
                                      bgcolor: 'rgba(255,255,255,0.06) !important',
                                      transform: 'translateX(3px)',
                                    },
                                  }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 30,
                                      // Active: full white icon; inactive: dimmed
                                      color: isChildActive
                                        ? '#fff'
                                        : 'rgba(255,255,255,0.45)',
                                      '& .MuiSvgIcon-root': { fontSize: 17 },
                                    }}
                                  >
                                    {child.icon}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={child.text}
                                    primaryTypographyProps={{
                                      sx: {
                                        fontSize: '0.87rem',
                                        // Active: bold white; inactive: semi-transparent
                                        fontWeight: isChildActive ? 700 : 500,
                                        color: isChildActive
                                          ? '#fff'
                                          : 'rgba(255,255,255,0.65)',
                                        fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                                      },
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  );
                }

                // ─── Normal item (unchanged) ───────────────────────────────
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + '/');

                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.2 }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleNavClick(item.path)}
                      sx={{
                        borderRadius: '10px', py: 1.1, px: 1.5,
                        transition: 'all 0.2s ease-in-out',
                        '&.Mui-selected': {
                          background: 'rgba(255,255,255,0.18)',
                          borderLeft: '3px solid #fff',
                          '&:hover': { background: 'rgba(255,255,255,0.22)' },
                        },
                        '&:not(.Mui-selected):hover': {
                          bgcolor: 'rgba(255,255,255,0.08)',
                          transform: 'translateX(3px)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: '0.95rem',
                            fontWeight: isActive ? 700 : 600,
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.90)',
                            fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom Scholar Status */}
      <Box sx={{ px: 1.5, pb: 2, pt: 1 }}>
        <Box
          sx={{
            p: 2, borderRadius: '14px',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Box display="flex" alignItems="center" gap={0.8} mb={0.6}>
            <Star sx={{ fontSize: 15, color: '#facc15' }} />
            <Typography
              sx={{
                fontSize: '0.68rem', fontWeight: 700, color: '#facc15',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
            >
              Scholar Status
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.70)', lineHeight: 1.4 }}>
            Batch #42A
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.50)', lineHeight: 1.4 }}>
            Ranked #1 this week
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  if (resolvedVariant === 'permanent') {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth, flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth, boxSizing: 'border-box',
            border: 'none', boxShadow: '4px 0 30px rgba(59,89,152,0.25)', overflow: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left" open={open} onClose={onClose}
      variant="temporary" ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth, boxSizing: 'border-box',
          border: 'none', boxShadow: '4px 0 30px rgba(59,89,152,0.35)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;