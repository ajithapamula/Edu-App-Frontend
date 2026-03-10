import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Skeleton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Search,
  Visibility,
  Download,
  Grade,
  Comment,
  Assignment,
  Person,
  Schedule,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  FilterList,
  AttachFile,
  Close,
  MoreVert
} from '@mui/icons-material';
import MentorViewTaskSubmission from './ViewTaskSubmission';
import { AuthContext } from '../../../context/AuthContext';
import { trainerTasksAPI } from '../../../services/API/trainertasks';

/* ── inject fonts + keyframes ── */
const _style = document.getElementById('ts-list-styles') || (() => {
  const s = document.createElement('style');
  s.id = 'ts-list-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes tsFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
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
const selectSx = {
  borderRadius: '10px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', background: '#f8fafc',
  '& fieldset': { borderColor: '#e8ecf2' }, '&:hover fieldset': { borderColor: '#bfdbfe' },
  '&.Mui-focused fieldset': { borderColor: '#0ea5e9', borderWidth: '1.5px' },
};
const accentBtn = {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', color: '#fff',
  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.85rem',
  textTransform: 'none', borderRadius: '10px', px: 2.5, py: 1,
  boxShadow: '0 4px 14px rgba(14,165,233,0.25)', border: 'none',
  '&:hover': { background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)', boxShadow: '0 6px 20px rgba(14,165,233,0.30)', transform: 'translateY(-1px)' },
  transition: 'all 0.3s ease',
};

const MentorTaskSubmissionsList = () => {
  const { user } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTask, setFilterTask] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [viewingSubmissionId, setViewingSubmissionId] = useState(null);

  // Three-dot menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuSubmissionId, setMenuSubmissionId] = useState(null);

  const handleMenuOpen = (event, submissionId) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuSubmissionId(submissionId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuSubmissionId(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // ✅ REAL API CALL — replaces mock data
  // Backend: GET /api/mentor/submissions/<mentor_id>
  // Returns: Submission_ID, Student_ID, Student_Name, Task_Name,
  //          Task_Submit, Task_ID, Submitted_At, Batch_ID, Task_Box
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.id) {
        setError('Mentor not logged in. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await trainerTasksAPI.getMentorSubmissions(user.id);

        // Map backend fields to component fields
        const mapped = (response.submissions || []).map((sub) => {
          // Extract filename from S3 URL for display
          const taskSubmitUrl = sub.Task_Submit || '';
          const fileName = taskSubmitUrl && taskSubmitUrl !== 'No file uploaded'
            ? decodeURIComponent(taskSubmitUrl.split('/').pop() || 'submission-file')
            : null;

          return {
            id: sub.Submission_ID,
            taskTitle: sub.Task_Name || sub.Task_Box || 'Untitled Task',
            taskId: sub.Task_ID,
            submitter: sub.Student_Name || `Student ${sub.Student_ID}`,
            studentId: sub.Student_ID,
            submitterAvatar: null,
            submissionDate: sub.Submitted_At || null,
            submissionText: sub.Task_Box || sub.Task_Name || '',
            attachments: fileName
              ? [{ name: fileName, size: 'N/A' }]
              : [],
            taskSubmitUrl: taskSubmitUrl,
            batchId: sub.Batch_ID,
          };
        });

        setSubmissions(mapped);
      } catch (err) {
        console.error('Error fetching mentor submissions:', err);
        setError(err.message || 'Failed to load submissions');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch =
      submission.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submitter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submissionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTask = filterTask === 'all' || submission.taskId?.toString() === filterTask;
    const matchesStudent = filterStudent === 'all' || submission.submitter === filterStudent;
    const matchesBatch = filterBatch === 'all' || submission.batchId?.toString() === filterBatch;
    return matchesSearch && matchesTask && matchesStudent && matchesBatch;
  });

  const handleViewSubmission = (submission) => { setViewingSubmissionId(submission.id); };
  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || '');
    setGradeDialogOpen(true);
  };
  const handleSaveGrade = () => {
    const updatedSubmissions = submissions.map(s =>
      s.id === selectedSubmission.id
        ? { ...s, grade, feedback, reviewedBy: 'Current Mentor', reviewedDate: new Date().toISOString() }
        : s
    );
    setSubmissions(updatedSubmissions);
    setGradeDialogOpen(false);
    setSelectedSubmission(null);
    setGrade(0);
    setFeedback('');
  };

 const handleDownload = async (attachment, submissionId) => {
    try {
      // Call backend to get presigned S3 URL
      const response = await trainerTasksAPI.viewMentorSubmissionDocument(submissionId, user.id);
      if (response && response.url) {
        window.open(response.url, '_blank');
      } else {
        console.error('No presigned URL returned');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Build unique filter options from real data
  const uniqueTasks = [];
  const taskIdSet = new Set();
  submissions.forEach(s => {
    if (s.taskId && !taskIdSet.has(s.taskId)) {
      taskIdSet.add(s.taskId);
      uniqueTasks.push({ id: s.taskId, title: s.taskTitle });
    }
  });

  const uniqueStudents = [...new Set(submissions.map(s => s.submitter))];

  const uniqueBatches = [...new Set(submissions.filter(s => s.batchId).map(s => s.batchId))];

  const statCards = [
    { label: 'Total Submissions', value: submissions.length, icon: <Assignment sx={{ fontSize: 22 }} />, color: '#1e3a8a' },
    { label: 'Students', value: uniqueStudents.length, icon: <Person sx={{ fontSize: 22 }} />, color: '#0ea5e9' },
    { label: 'Tasks', value: uniqueTasks.length, icon: <CheckCircle sx={{ fontSize: 22 }} />, color: '#0d9488' },
    { label: 'Batches', value: uniqueBatches.length, icon: <Schedule sx={{ fontSize: 22 }} />, color: '#f59e0b' },
  ];

  // Build menu actions for a given submission
  const getMenuActions = (sub) => {
    if (!sub) return [];
    const actions = [
      { label: 'View', icon: <Visibility sx={{ fontSize: 18 }} />, color: '#0ea5e9', onClick: () => { handleViewSubmission(sub); handleMenuClose(); } },
      { label: 'Grade', icon: <Grade sx={{ fontSize: 18 }} />, color: '#1e3a8a', onClick: () => { handleGradeSubmission(sub); handleMenuClose(); } },
    ];
    // Add download item if file exists
    if (sub.attachments && sub.attachments.length > 0) {
      sub.attachments.forEach((att, idx) => {
        actions.push({
          label: `Download ${att.name}`,
          icon: <Download sx={{ fontSize: 18 }} />,
          color: '#0d9488',
          onClick: () => { handleDownload(att, sub.id); handleMenuClose(); },
          isDividerBefore: idx === 0,
        });
      });
    }
    return actions;
  };

  if (viewingSubmissionId) {
    return (
      <MentorViewTaskSubmission
        submissionId={viewingSubmissionId}
        onBack={() => setViewingSubmissionId(null)}
        onEdit={(sub) => {
          setViewingSubmissionId(null);
          handleGradeSubmission(sub);
        }}
      />
    );
  }

  if (loading) {
    return (
      <Box sx={{ background: '#f1f5f9', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
          <Box><Skeleton variant="text" width={220} height={32} /><Skeleton variant="text" width={140} height={18} /></Box>
        </Box>
        <Box display="flex" gap={2} mb={2.5}>{[0,1,2,3].map(i => <Skeleton key={i} variant="rounded" sx={{ flex: 1, height: 80, borderRadius: '14px' }} />)}</Box>
        <Skeleton variant="rounded" width="100%" height={60} sx={{ borderRadius: '14px', mb: 2.5 }} />
        <Skeleton variant="rounded" width="100%" height={300} sx={{ borderRadius: '14px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ background: '#f1f5f9', minHeight: '100vh', width: '100%', p: { xs: 2, sm: 2.5, md: 3 }, boxSizing: 'border-box' }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontFamily: '"DM Sans", sans-serif' }}
          onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, animation: 'tsFadeUp 0.5s ease-out both' }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '12px',
          background: 'linear-gradient(135deg, #0ea5e9, #0d9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
        }}>
          <Assignment sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ ...hFont, fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.2 }}>Task Submissions</Typography>
          <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b', mt: 0.2 }}>{filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found</Typography>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, animation: 'tsFadeUp 0.5s ease-out 0.1s both' }}>
        {statCards.map((c, i) => (
          <Paper key={i} elevation={0} sx={{
            ...crd, p: 2.5, flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 0' }, minWidth: 0,
            transition: 'all 0.3s ease',
            '&:hover': { boxShadow: '0 6px 24px rgba(30,58,138,0.10)', transform: 'translateY(-2px)' },
          }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px',
                background: `${c.color}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color,
              }}>{c.icon}</Box>
              <Box>
                <Typography sx={{ ...hFont, fontSize: '1.35rem', lineHeight: 1.2, color: c.color }}>{c.value}</Typography>
                <Typography sx={{ ...bFont, fontSize: '0.76rem', color: '#64748b', mt: 0.1 }}>{c.label}</Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ ...crd, p: 2.5, mb: 2.5, animation: 'tsFadeUp 0.5s ease-out 0.15s both' }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search submissions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            sx={{ ...inputSx, flex: '1 1 220px', maxWidth: 320 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontFamily: '"DM Sans", sans-serif', color: '#64748b', '&.Mui-focused': { color: '#0ea5e9' } }}>Task</InputLabel>
            <Select value={filterTask} label="Task" onChange={(e) => setFilterTask(e.target.value)} sx={selectSx}>
              <MenuItem value="all">All Tasks</MenuItem>
              {uniqueTasks.map((task) => <MenuItem key={task.id} value={task.id.toString()}>{task.title}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontFamily: '"DM Sans", sans-serif', color: '#64748b', '&.Mui-focused': { color: '#0ea5e9' } }}>Student</InputLabel>
            <Select value={filterStudent} label="Student" onChange={(e) => setFilterStudent(e.target.value)} sx={selectSx}>
              <MenuItem value="all">All Students</MenuItem>
              {uniqueStudents.map((student) => <MenuItem key={student} value={student}>{student}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ fontFamily: '"DM Sans", sans-serif', color: '#64748b', '&.Mui-focused': { color: '#0ea5e9' } }}>Batch</InputLabel>
            <Select value={filterBatch} label="Batch" onChange={(e) => setFilterBatch(e.target.value)} sx={selectSx}>
              <MenuItem value="all">All Batches</MenuItem>
              {uniqueBatches.map((batchId) => <MenuItem key={batchId} value={batchId.toString()}>Batch {batchId}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<FilterList sx={{ fontSize: 18 }} />}
            onClick={() => { setSearchTerm(''); setFilterTask('all'); setFilterStudent('all'); setFilterBatch('all'); }}
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '0.82rem',
              textTransform: 'none', borderRadius: '10px', border: '1.5px solid #e8ecf2', color: '#475569', px: 2, py: 0.85,
              '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' }, transition: 'all 0.3s ease',
            }}>
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ ...crd, overflow: 'hidden', animation: 'tsFadeUp 0.5s ease-out 0.2s both' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Task & Submission', 'Student', 'Batch', 'Submitted Date', 'File', 'Actions'].map(h => (
                  <TableCell key={h} sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.73rem', color: '#1e3a8a', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '2px solid #e8ecf2', py: 1.5,
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ borderBottom: 'none', py: 5 }}>
                    <Box textAlign="center">
                      <Box sx={{ width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 1.5, background: 'rgba(14,165,233,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Assignment sx={{ color: '#0ea5e9', fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ ...hFont, fontSize: '1rem', mb: 0.5 }}>No Submissions Found</Typography>
                      <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>
                        {submissions.length === 0
                          ? 'No students have submitted tasks for your batches yet'
                          : 'Try adjusting your search criteria'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => (
                  <TableRow key={sub.id} sx={{
                    transition: 'background 0.2s ease',
                    background: '#fff',
                    '&:hover': { background: '#f8fafc' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}>
                    {/* Task & Submission */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 2, maxWidth: 360 }}>
                      <Box display="flex" alignItems="flex-start" gap={1.5}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '8px', mt: 0.3, flexShrink: 0,
                          background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#0ea5e9',
                        }}>
                          <Assignment sx={{ fontSize: 18 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ ...hFont, fontSize: '0.88rem', fontWeight: 700 }}>{sub.taskTitle}</Typography>
                          <Typography sx={{ ...bFont, fontSize: '0.8rem', color: '#64748b', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {sub.submissionText ? sub.submissionText.substring(0, 100) : ''}
                          </Typography>
                          {sub.attachments.length > 0 && (
                            <Box display="flex" alignItems="center" gap={0.3} mt={0.5}>
                              <AttachFile sx={{ fontSize: 13, color: '#94a3b8' }} />
                              <Typography sx={{ ...bFont, fontSize: '0.72rem', color: '#94a3b8' }}>{sub.attachments.length} file{sub.attachments.length !== 1 ? 's' : ''}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Student */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #0ea5e9, #0d9488)' }}>
                          {sub.submitter.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ ...bFont, fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{sub.submitter}</Typography>
                          {sub.studentId && (
                            <Typography sx={{ ...bFont, fontSize: '0.7rem', color: '#94a3b8' }}>ID: {sub.studentId}</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Batch */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}>
                      {sub.batchId ? (
                        <Chip label={`Batch ${sub.batchId}`} size="small" sx={{
                          height: 26, fontSize: '0.72rem', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                          background: '#f0f4ff', color: '#1e3a8a', border: '1px solid #dbeafe',
                        }} />
                      ) : (
                        <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#94a3b8' }}>N/A</Typography>
                      )}
                    </TableCell>
                    {/* Date */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}>
                      <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#64748b' }}>{formatDate(sub.submissionDate)}</Typography>
                    </TableCell>
                    {/* File */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}>
                      {sub.attachments.length > 0 ? (
                        <Box>
                          {sub.attachments.map((att, idx) => (
                            <Typography key={idx} sx={{ ...bFont, fontSize: '0.78rem', color: '#0ea5e9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                              {att.name}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography sx={{ ...bFont, fontSize: '0.82rem', color: '#94a3b8' }}>No file</Typography>
                      )}
                    </TableCell>
                    {/* Actions - Three dot menu */}
                    <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, sub.id)}
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '8px',
                          color: '#475569',
                          background: '#f8fafc',
                          border: '1px solid #e8ecf2',
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            background: '#f0f4ff',
                            borderColor: '#bfdbfe',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <MoreVert sx={{ fontSize: 19 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Single shared Menu component */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              border: '1px solid #e8ecf2',
              boxShadow: '0 8px 30px rgba(30,58,138,0.12)',
              minWidth: 200,
              mt: 0.5,
              overflow: 'visible',
              '& .MuiList-root': { py: 0.5 },
            },
          }}
        >
          {menuSubmissionId && (() => {
            const sub = filteredSubmissions.find(s => s.id === menuSubmissionId);
            if (!sub) return null;
            const actions = getMenuActions(sub);
            return actions.map((action, i) => (
              <React.Fragment key={i}>
                {action.isDividerBefore && (
                  <Divider sx={{ my: 0.5, borderColor: '#f1f5f9' }} />
                )}
                <MenuItem
                  onClick={action.onClick}
                  sx={{
                    py: 1.2,
                    px: 2,
                    mx: 0.5,
                    my: 0.3,
                    borderRadius: '8px',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.85rem',
                    color: action.color,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: `${action.color}0A`,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: action.color, minWidth: 34 }}>
                    {action.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={action.label}
                    primaryTypographyProps={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: action.color,
                      noWrap: true,
                    }}
                  />
                </MenuItem>
              </React.Fragment>
            ));
          })()}
        </Menu>
      </Paper>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 24px 48px rgba(30,58,138,0.12)', border: '1px solid #e8ecf2' } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', color: 'white', py: 2.5, borderRadius: '16px 16px 0 0' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Grade sx={{ fontSize: 24 }} />
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
                Grade: {selectedSubmission?.taskTitle}
              </Typography>
            </Box>
            <IconButton onClick={() => setGradeDialogOpen(false)} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3.5, background: '#f8fafc' }}>
          <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px', border: '1px solid #e8ecf2', mb: 3 }}>
            <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>Submitted by:</strong> {selectedSubmission?.submitter}
            </Typography>
            <Typography sx={{ ...bFont, fontSize: '0.84rem', color: '#64748b', mt: 1 }}>{selectedSubmission?.submissionText}</Typography>
          </Box>
          <Typography sx={{ ...hFont, fontSize: '0.9rem', mb: 1 }}>Grade (out of 100)</Typography>
          <TextField type="number" value={grade} onChange={(e) => setGrade(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }} fullWidth sx={{ ...inputSx, mb: 2 }} />
          <Rating value={grade / 20} onChange={(e, v) => setGrade(v * 20)} max={5} precision={0.5} sx={{ mb: 3, '& .MuiRating-iconFilled': { color: '#0ea5e9' } }} />
          <Typography sx={{ ...hFont, fontSize: '0.9rem', mb: 1 }}>Feedback</Typography>
          <TextField multiline rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide feedback..." fullWidth sx={inputSx} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, background: '#f8fafc' }}>
          <Button onClick={() => setGradeDialogOpen(false)} sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, textTransform: 'none',
            borderRadius: '10px', color: '#64748b', border: '1.5px solid #e8ecf2', px: 3,
            '&:hover': { borderColor: '#bfdbfe', background: '#f0f4ff' },
          }}>Cancel</Button>
          <Button onClick={handleSaveGrade} variant="contained" disableElevation sx={accentBtn}>Save Grade & Feedback</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorTaskSubmissionsList;
