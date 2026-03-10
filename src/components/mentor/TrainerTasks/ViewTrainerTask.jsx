import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Skeleton,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Person,
  CalendarToday,
  CheckCircle,
  Warning,
  Info,
  Download,
  ArrowBack,
  QuestionAnswer,
  Category,
  Group,
  Tag
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerTasksAPI } from '../../../services/API/trainertasks';
import { AuthContext } from '../../../context/AuthContext';

/* ── inject fonts + keyframes ── */
const styleTag = document.getElementById('tt-view-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'tt-view-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes ttvFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ── design tokens ── */
const hFont = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' };
const bFont = { fontFamily: '"DM Sans", sans-serif', color: '#475569' };
const cardBase = { background: '#ffffff', borderRadius: '14px', border: '1px solid #e8ecf2', boxShadow: '0 2px 12px rgba(30,58,138,0.06)' };
const accentBtn = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: '#fff',
  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.85rem',
  textTransform: 'none', borderRadius: '10px', px: 2.5, py: 1,
  boxShadow: '0 4px 14px rgba(14,165,233,0.25)', border: 'none',
  '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)', boxShadow: '0 6px 20px rgba(14,165,233,0.30)', transform: 'translateY(-1px)' },
  transition: 'all 0.3s ease',
};

/* ── Shimmer ── */
const ViewTrainerTaskShimmer = () => (
  <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
      <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={260} height={32} />
        <Skeleton variant="text" width={180} height={18} />
      </Box>
    </Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
      {[0, 1, 2].map(i => <Skeleton key={i} variant="rounded" width="33%" height={100} sx={{ borderRadius: '14px' }} />)}
    </Box>
    <Box sx={{ display: 'flex', gap: 2.5 }}>
      <Box sx={{ flex: 2 }}>
        <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: '14px', mb: 2.5 }} />
        <Skeleton variant="rounded" width="100%" height={220} sx={{ borderRadius: '14px' }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="rounded" width="100%" height={260} sx={{ borderRadius: '14px' }} />
      </Box>
    </Box>
  </Box>
);

const MentorViewTrainerTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && id !== 'undefined') { fetchTask(); }
    else { setError('Invalid task ID provided'); setLoading(false); }
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true); setError('');
      if (!id || id === 'undefined' || id === 'null') throw new Error('Invalid task ID');
      const mentorId = user?.id || user?.ID || user?.mentor_id;
      if (!mentorId) throw new Error('Mentor ID not found. Please log in again.');
      const response = await trainerTasksAPI.getMentorTaskById(id, mentorId);
      if (!response) throw new Error('No data received from server');
      const transformedTask = transformApiResponse(response);
      setTask(transformedTask);
    } catch (err) {
      setError('Failed to fetch task details: ' + (err.message || err.toString()));
    } finally { setLoading(false); }
  };

  const transformApiResponse = (apiData) => {
    if (!apiData) return null;
    const taskData = Array.isArray(apiData) ? apiData[0] : apiData;
    if (!taskData) return null;
    const taskContent = taskData.Task_Content || taskData.Task_Box || '';
    const questions = taskContent
      ? taskContent.split('?').map(q => q.trim()).filter(q => q).map(q => q.endsWith('?') ? q : q + '?')
      : [];
    return {
      id: taskData.Task_ID || taskData.ID,
      batchId: taskData.Batch_ID,
      batchCode: taskData.Batch_Code,
      sessionId: taskData.Session_ID,
      title: `Task #${taskData.Task_ID || taskData.ID} - Session ${taskData.Session_ID}`,
      description: `Training task for Batch ${taskData.Batch_Code || taskData.Batch_ID} containing ${questions.length} question${questions.length !== 1 ? 's' : ''}`,
      questions: questions,
      taskBox: taskContent,
      startDateTime: taskData.Start_DateTime,
      endDateTime: taskData.End_DateTime,
      assignedDate: new Date().toISOString(),
      originalData: taskData
    };
  };

  if (loading) return <ViewTrainerTaskShimmer />;

  if (error) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/mentor/tasks')} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' },
          }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...hFont, fontSize: '1.3rem' }}>Task Not Found</Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', border: '1px solid #fecaca' }}>{error}</Alert>
        <Button variant="contained" disableElevation onClick={() => window.location.reload()} sx={accentBtn}>Retry</Button>
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/mentor/tasks')} sx={{
            width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
            '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' },
          }}>
            <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Typography sx={{ ...hFont, fontSize: '1.3rem' }}>Task Not Found</Typography>
        </Box>
        <Alert severity="warning" sx={{ borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}>Task not found</Alert>
      </Box>
    );
  }

  const statCards = [
    { label: 'Task ID', value: `#${task.id}`, icon: <Assignment sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { label: 'Batch ID', value: task.batchId, icon: <Group sx={{ fontSize: 22 }} />, color: '#0ea5e9' },
    { label: 'Session ID', value: task.sessionId, icon: <Schedule sx={{ fontSize: 22 }} />, color: '#0d9488' },
  ];

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, animation: 'ttvFadeUp 0.5s ease-out both' }}>
        <IconButton onClick={() => navigate('/mentor/tasks')} sx={{
          width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf2',
          '&:hover': { background: '#f0f4ff', borderColor: '#bfdbfe' }, transition: 'all 0.3s ease',
        }}>
          <ArrowBack sx={{ fontSize: 20, color: '#475569' }} />
        </IconButton>
        <Box sx={{
          width: 44, height: 44, borderRadius: '12px',
          background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
        }}>
          <Assignment sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ ...hFont, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>
            {task.title}
          </Typography>
          <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>
            {task.description}
          </Typography>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' }, animation: 'ttvFadeUp 0.5s ease-out 0.1s both' }}>
        {statCards.map((c, i) => (
          <Paper key={i} elevation={0} sx={{
            ...cardBase, p: 2.5, flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0,
            transition: 'all 0.3s ease',
            '&:hover': { boxShadow: '0 6px 24px rgba(30,58,138,0.10)', transform: 'translateY(-2px)' },
          }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px',
                background: `${c.color}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color,
              }}>
                {c.icon}
              </Box>
              <Typography sx={{ ...bFont, fontSize: '0.74rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                {c.label}
              </Typography>
            </Box>
            <Typography sx={{ ...hFont, fontSize: '1.25rem', color: c.color }}>
              {c.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', md: 'row' }, animation: 'ttvFadeUp 0.5s ease-out 0.2s both' }}>
        {/* Left Column */}
        <Box sx={{ flex: '1 1 65%', minWidth: 0 }}>
          {/* Task Description */}
          <Paper elevation={0} sx={{ ...cardBase, p: 3, mb: 2.5 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Info sx={{ color: '#0ea5e9', fontSize: 18 }} />
              </Box>
              Task Description
            </Typography>
            <Typography sx={{ ...bFont, fontSize: '0.9rem', lineHeight: 1.7, color: '#475569' }}>
              {task.description}
            </Typography>
            <Divider sx={{ my: 2.5, borderColor: '#f1f5f9' }} />
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {statCards.map((c, i) => (
                <Box key={i}>
                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                    <Box sx={{ color: c.color, display: 'flex' }}>{React.cloneElement(c.icon, { sx: { fontSize: 16 } })}</Box>
                    <Typography sx={{ ...bFont, fontSize: '0.74rem', color: '#64748b' }}>{c.label}</Typography>
                  </Box>
                  <Typography sx={{ ...hFont, fontSize: '0.95rem', fontWeight: 600 }}>{c.value}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Questions */}
          <Paper elevation={0} sx={{ ...cardBase, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <QuestionAnswer sx={{ color: '#0d9488', fontSize: 18 }} />
              </Box>
              Task Questions ({task.questions.length})
            </Typography>
            {task.questions.length > 0 ? (
              <List sx={{ p: 0 }}>
                {task.questions.map((question, index) => (
                  <ListItem key={index} sx={{
                    px: 2, py: 1.5, mb: 1, borderRadius: '10px',
                    background: index % 2 === 0 ? '#f8fafc' : '#fff',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.2s ease',
                    '&:hover': { background: '#f0f4ff', borderColor: '#dbeafe' },
                  }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar sx={{
                        width: 28, height: 28, fontSize: '0.78rem',
                        fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                        background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
                        boxShadow: '0 2px 8px rgba(14,165,233,0.25)',
                      }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={question}
                      primaryTypographyProps={{
                        sx: { ...bFont, fontSize: '0.88rem', fontWeight: 500, color: '#0f172a' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '12px', mx: 'auto', mb: 1.5,
                  background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <QuestionAnswer sx={{ color: '#94a3b8', fontSize: 24 }} />
                </Box>
                <Typography sx={{ ...bFont, fontSize: '0.86rem', color: '#94a3b8' }}>No questions available for this task.</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: '1 1 35%', minWidth: 0 }}>
          <Paper elevation={0} sx={{ ...cardBase, p: 3 }}>
            <Typography sx={{ ...hFont, fontSize: '1.05rem', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'rgba(30,58,138,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Assignment sx={{ color: '#1e3a8a', fontSize: 18 }} />
              </Box>
              Task Summary
            </Typography>

            {/* Questions Count */}
            <Box sx={{ textAlign: 'center', p: 2.5, mb: 2.5, borderRadius: '12px', background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(13,148,136,0.03))' }}>
              <Typography sx={{
                ...hFont, fontSize: '2rem', lineHeight: 1.2,
                background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {task.questions.length}
              </Typography>
              <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.3 }}>Total Questions</Typography>
            </Box>

            <Divider sx={{ mb: 2.5, borderColor: '#f1f5f9' }} />

            {/* Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Task ID', value: `#${task.id}` },
                { label: 'Batch ID', value: task.batchId },
                { label: 'Session ID', value: task.sessionId },
                { label: 'Questions', value: task.questions.length },
              ].map((row, i) => (
                <Box key={i} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: 1, px: 1.5, borderRadius: '8px',
                  background: i % 2 === 0 ? '#f8fafc' : 'transparent',
                }}>
                  <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>{row.label}</Typography>
                  <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 600 }}>{row.value}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default MentorViewTrainerTask;